import {
  WENSHUGE_FEATURES,
  WENSHUGE_TEST_RECORDS,
  WENSHUGE_TRAIN_RECORDS,
} from "./datasets";
import type {
  DetectionLabel,
  WenshugeDayRecord,
  WenshugeFeatureDefinition,
  WenshugeFeatureKey,
  WenshugeMetrics,
  WenshugeScoredRecord,
  WenshugeSimulationConfig,
  WenshugeSimulationResult,
} from "./types";

interface FeatureStats {
  mean: number;
  std: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hashNoise(day: number, token: string) {
  let hash = 17;
  for (const char of token) {
    hash = (hash * 33 + char.charCodeAt(0)) % 10007;
  }
  const raw = Math.sin(day * 13.37 + hash * 0.73) * 43758.5453;
  return raw - Math.floor(raw);
}

function buildFeatureStats(
  records: WenshugeDayRecord[],
  selectedFeatures: WenshugeFeatureDefinition[],
) {
  const stats: Partial<Record<WenshugeFeatureKey, FeatureStats>> = {};

  for (const feature of selectedFeatures) {
    const values = records.map((record) => record.values[feature.key]);
    const mean = average(values);
    const variance = average(values.map((value) => (value - mean) ** 2));
    const std = Math.sqrt(variance);

    stats[feature.key] = {
      mean,
      std: Math.max(std, 0.0001),
    };
  }

  return stats;
}

function oppositeLabel(label: DetectionLabel): DetectionLabel {
  return label === "anomaly" ? "normal" : "anomaly";
}

function scoreRecord(input: {
  record: WenshugeDayRecord;
  selectedFeatures: WenshugeFeatureDefinition[];
  selectedRelevant: number;
  selectedIrrelevant: number;
  stats: Partial<Record<WenshugeFeatureKey, FeatureStats>>;
  config: WenshugeSimulationConfig;
  threshold: number;
}): WenshugeScoredRecord {
  const {
    record,
    selectedFeatures,
    selectedRelevant,
    selectedIrrelevant,
    stats,
    config,
    threshold,
  } = input;

  const totalRelevant = WENSHUGE_FEATURES.filter((feature) => feature.isRelevant).length;
  const relevantCoverage = selectedRelevant / Math.max(totalRelevant, 1);

  const relevantSignals: number[] = [];
  const irrelevantSignals: number[] = [];

  for (const feature of selectedFeatures) {
    const value = record.values[feature.key];
    const stat = stats[feature.key] ?? { mean: value, std: 1 };
    const noise = hashNoise(record.day, feature.key);

    if (config.standardize) {
      const z = Math.abs((value - stat.mean) / stat.std);
      if (feature.isRelevant) {
        relevantSignals.push(clamp((z - 0.55) / 2.8, 0, 1));
      } else {
        const uselessVariance = clamp((z - 0.9) / 3.5, 0, 1);
        irrelevantSignals.push(clamp(0.28 * uselessVariance + 0.04 + noise * 0.1, 0, 1));
      }
      continue;
    }

    const baseline = Math.max(Math.abs(stat.mean) * 0.2, stat.std * 0.6, 1);
    const ratio = Math.abs(value - stat.mean) / baseline;

    if (feature.isRelevant) {
      relevantSignals.push(clamp((ratio - 0.4) / 3.8, 0, 1));
    } else {
      const uselessVariance = clamp((ratio - 0.7) / 4.3, 0, 1);
      irrelevantSignals.push(clamp(0.65 * uselessVariance + 0.12 + noise * 0.18, 0, 1));
    }
  }

  const relevantScore = relevantSignals.length > 0 ? average(relevantSignals) : 0.08;
  const irrelevantScore = irrelevantSignals.length > 0 ? average(irrelevantSignals) : 0;

  let score = 0.06 + 0.76 * relevantScore + 0.34 * irrelevantScore;
  score += (1 - relevantCoverage) * 0.06;
  score += selectedIrrelevant * 0.012;

  if (!config.standardize) {
    score += selectedIrrelevant * 0.01 + 0.03;
  }

  if (!config.dropSensorErrors && record.sensorError) {
    score += 0.2;
  }

  if (!config.dropSensorErrors && record.truth === "anomaly") {
    score -= 0.03;
  }

  if (config.dropSensorErrors && record.sensorError) {
    score += 0.08;
  }

  score += (hashNoise(record.day, "global-noise") - 0.5) * 0.06;
  score = clamp(score, 0.02, 0.97);

  return {
    ...record,
    score,
    predicted: score >= threshold ? "anomaly" : "normal",
  };
}

function calculateAuc(rows: WenshugeScoredRecord[]) {
  const positives = rows.filter((row) => row.truth === "anomaly").map((row) => row.score);
  const negatives = rows.filter((row) => row.truth === "normal").map((row) => row.score);

  if (positives.length === 0 || negatives.length === 0) {
    return 0.5;
  }

  let wins = 0;
  const totalPairs = positives.length * negatives.length;

  for (const positive of positives) {
    for (const negative of negatives) {
      if (positive > negative) {
        wins += 1;
      } else if (Math.abs(positive - negative) < 1e-9) {
        wins += 0.5;
      }
    }
  }

  return wins / totalPairs;
}

function calculateMetrics(rows: WenshugeScoredRecord[]): WenshugeMetrics {
  const tp = rows.filter((row) => row.truth === "anomaly" && row.predicted === "anomaly").length;
  const tn = rows.filter((row) => row.truth === "normal" && row.predicted === "normal").length;
  const fp = rows.filter((row) => row.truth === "normal" && row.predicted === "anomaly").length;
  const fn = rows.filter((row) => row.truth === "anomaly" && row.predicted === "normal").length;

  const total = Math.max(rows.length, 1);
  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const auc = calculateAuc(rows);

  return {
    tp,
    tn,
    fp,
    fn,
    accuracy,
    precision,
    recall,
    f1,
    auc,
  };
}

function enforceNonPerfectAccuracy(rows: WenshugeScoredRecord[], threshold: number) {
  const metrics = calculateMetrics(rows);
  if (metrics.accuracy < 0.999 || rows.length === 0) {
    return rows;
  }

  const candidate = [...rows].sort(
    (a, b) => Math.abs(a.score - threshold) - Math.abs(b.score - threshold),
  )[0];

  if (!candidate) {
    return rows;
  }

  return rows.map((row) =>
    row.day === candidate.day
      ? {
          ...row,
          predicted: oppositeLabel(row.truth),
        }
      : row,
  );
}

export function toPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function runWenshugeSimulation(
  config: WenshugeSimulationConfig,
): WenshugeSimulationResult | null {
  if (config.selectedFeatureKeys.length === 0) {
    return null;
  }

  const selectedKeySet = new Set(config.selectedFeatureKeys);
  const selectedFeatures = WENSHUGE_FEATURES.filter((feature) => selectedKeySet.has(feature.key));

  const selectedRelevant = selectedFeatures.filter((feature) => feature.isRelevant).length;
  const selectedIrrelevant = selectedFeatures.length - selectedRelevant;
  const threshold = clamp(config.threshold, 0.2, 0.5);

  const trainingReference = config.dropSensorErrors
    ? WENSHUGE_TRAIN_RECORDS.filter((record) => !record.sensorError)
    : WENSHUGE_TRAIN_RECORDS;

  const stats = buildFeatureStats(trainingReference, selectedFeatures);

  const trainRows = WENSHUGE_TRAIN_RECORDS.map((record) =>
    scoreRecord({
      record,
      selectedFeatures,
      selectedRelevant,
      selectedIrrelevant,
      stats,
      config,
      threshold,
    }),
  );

  const rawTestRows = WENSHUGE_TEST_RECORDS.map((record) =>
    scoreRecord({
      record,
      selectedFeatures,
      selectedRelevant,
      selectedIrrelevant,
      stats,
      config,
      threshold,
    }),
  );

  const testRows = enforceNonPerfectAccuracy(rawTestRows, threshold);

  const trainMetrics = calculateMetrics(trainRows);
  const testMetrics = calculateMetrics(testRows);

  const qualityScore = clamp(
    0.46 +
      selectedRelevant * 0.08 -
      selectedIrrelevant * 0.06 +
      (config.standardize ? 0.05 : -0.05) +
      (config.dropSensorErrors ? 0.06 : -0.04),
    0.41,
    0.92,
  );

  return {
    selectedRelevant,
    selectedIrrelevant,
    qualityScore,
    trainingReferenceDays: trainingReference.length,
    trainRows,
    testRows,
    trainMetrics,
    testMetrics,
  };
}
