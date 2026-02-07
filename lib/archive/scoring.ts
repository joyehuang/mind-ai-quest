import { ARCHIVE_HISTORY, MONITOR_SERIES } from "./data";
import type {
  BaselineRange,
  BaselineStats,
  DaySensorPoint,
  MonitorEval,
  MonitorPrediction,
  SensitivityLevel,
} from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function std(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, item) => sum + (item - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function baselineDays(range: BaselineRange) {
  const days: number[] = [];
  for (let day = range.start; day <= range.end; day += 1) {
    days.push(day);
  }
  return days;
}

export function clampBaselineRange(range: BaselineRange): BaselineRange {
  let start = clamp(range.start, 1, 30);
  let end = clamp(range.end, 1, 30);

  if (end < start) {
    [start, end] = [end, start];
  }

  if (end - start + 1 < 5) {
    end = Math.min(30, start + 4);
  }

  if (end - start + 1 > 10) {
    end = start + 9;
  }

  if (end > 30) {
    const overshoot = end - 30;
    start -= overshoot;
    end = 30;
  }

  start = Math.max(1, start);

  return { start, end };
}

export function calcBaselineStats(range: BaselineRange): BaselineStats {
  const days = baselineDays(range);
  const points = ARCHIVE_HISTORY.filter((item) => days.includes(item.day));

  const tilts = points.map((item) => item.tilt);
  const humidities = points.map((item) => item.humidity);
  const temperatures = points.map((item) => item.temperature);

  const meanTilt = mean(tilts);
  const stdTilt = std(tilts);
  const meanHumidity = mean(humidities);
  const stdHumidity = std(humidities);
  const meanTemperature = mean(temperatures);
  const stdTemperature = std(temperatures);

  const containsAnomaly = points.some((item) => item.anomaly);

  const stabilityScore = clamp(1 - stdTilt / 0.28, 0, 1);
  const anomalyPenalty = containsAnomaly ? 0.34 : 0;
  const qualityScore = clamp(0.78 * stabilityScore + 0.22 * (containsAnomaly ? 0 : 1) - anomalyPenalty, 0.2, 1);

  return {
    meanTilt,
    stdTilt,
    meanHumidity,
    stdHumidity,
    meanTemperature,
    stdTemperature,
    containsAnomaly,
    qualityScore,
  };
}

function sensitivityThreshold(level: SensitivityLevel) {
  if (level === "relaxed") return 1.25;
  if (level === "strict") return 0.85;
  return 1;
}

export function runMonitorDetection(range: BaselineRange, sensitivity: SensitivityLevel): MonitorEval {
  const stats = calcBaselineStats(range);
  const threshold = sensitivityThreshold(sensitivity);

  const anomalyBias = stats.containsAnomaly ? 0.35 : 0;
  const unstableBias = clamp((stats.stdTilt - 0.08) * 3.2, 0, 0.24);
  const baselineBias = anomalyBias + unstableBias;

  const predictions: MonitorPrediction[] = MONITOR_SERIES.map((point) => {
    const score = point.deviation + baselineBias;
    const predictedAnomaly = score >= threshold;

    return {
      day: point.day,
      predictedAnomaly,
      score,
      point,
    };
  });

  const alertsRaised = predictions.filter((item) => item.predictedAnomaly).length;
  const trueAnomalies = predictions.filter(
    (item) => item.predictedAnomaly && item.point.realAnomaly,
  ).length;
  const falseAlarms = predictions.filter(
    (item) => item.predictedAnomaly && !item.point.realAnomaly,
  ).length;
  const misses = predictions.filter(
    (item) => !item.predictedAnomaly && item.point.realAnomaly,
  ).length;

  const correct = predictions.filter(
    (item) => item.predictedAnomaly === item.point.realAnomaly,
  ).length;

  return {
    predictions,
    alertsRaised,
    trueAnomalies,
    falseAlarms,
    misses,
    accuracy: correct / Math.max(predictions.length, 1),
  };
}

export function sensorRange(points: DaySensorPoint[], key: "tilt" | "humidity" | "temperature") {
  const values = points.map((item) => item[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, spread: Math.max(max - min, 0.0001) };
}
