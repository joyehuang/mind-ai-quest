import { oppositeLabel } from "./confusion";
import type {
  FarmSample,
  FinalScore,
  HyperParams,
  HyperScore,
  LossPoint,
  ModelJudgment,
  PredictionRecord,
  RiceLabel,
  TrainingSetQuality,
} from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function countLabeledSamples(labels: Record<string, RiceLabel>, samples: FarmSample[]) {
  return samples.filter((sample) => labels[sample.id] !== undefined).length;
}

export function countLabelCorrect(labels: Record<string, RiceLabel>, samples: FarmSample[]) {
  return samples.filter((sample) => labels[sample.id] === sample.groundTruth).length;
}

export function calculateStep2Score(labels: Record<string, RiceLabel>, samples: FarmSample[]) {
  if (samples.length === 0) {
    return 0;
  }
  return countLabelCorrect(labels, samples) / samples.length;
}

export function calculateStep2Errors(labels: Record<string, RiceLabel>, samples: FarmSample[]) {
  return samples.length - countLabelCorrect(labels, samples);
}

export function calculateTrainingSetQuality(samples: FarmSample[]): TrainingSetQuality {
  if (samples.length === 0) {
    return {
      coverage: 0,
      balance: 0,
      quality: 0,
    };
  }

  const coverage = samples.reduce((sum, item) => sum + item.qualityWeight, 0) / samples.length;

  const healthy = samples.filter((sample) => sample.groundTruth === "healthy").length;
  const unhealthy = samples.length - healthy;
  const balance = clamp(1 - Math.abs(healthy - unhealthy) / samples.length, 0, 1);

  const quality = clamp(0.55 * coverage + 0.45 * balance, 0, 1);

  return {
    coverage,
    balance,
    quality,
  };
}

export function calculateSecondFieldAccuracy(step2Score: number, trainingSetQuality: number) {
  return clamp(0.38 + 0.3 * step2Score + 0.24 * trainingSetQuality, 0.45, 0.85);
}

export function buildPredictions(
  samples: FarmSample[],
  targetAccuracy: number,
  seed = 13,
): PredictionRecord[] {
  const boundedAccuracy = clamp(targetAccuracy, 0, 1);
  const targetCorrect = Math.round(samples.length * boundedAccuracy);

  const ranked = [...samples].sort((a, b) => {
    const scoreA = (a.id.charCodeAt(0) * 23 + Number(a.id.slice(1)) * 31 + seed * 17) % 101;
    const scoreB = (b.id.charCodeAt(0) * 23 + Number(b.id.slice(1)) * 31 + seed * 17) % 101;
    return scoreA - scoreB;
  });

  const correctIds = new Set(ranked.slice(0, targetCorrect).map((sample) => sample.id));

  return samples.map((sample) => {
    const predicted = correctIds.has(sample.id)
      ? sample.groundTruth
      : oppositeLabel(sample.groundTruth);

    return {
      sample,
      predicted,
      correct: predicted === sample.groundTruth,
    };
  });
}

export function calculateStep4Score(
  reviews: Record<string, ModelJudgment>,
  predictions: PredictionRecord[],
) {
  if (predictions.length === 0) {
    return 0;
  }

  const correct = predictions.filter((item) => {
    const review = reviews[item.sample.id];
    if (!review) {
      return false;
    }

    const modelCorrect = item.correct;
    const judgedCorrect = review === "model_correct";
    return modelCorrect === judgedCorrect;
  }).length;

  return correct / predictions.length;
}

export function calculateStep4CorrectCount(
  reviews: Record<string, ModelJudgment>,
  predictions: PredictionRecord[],
) {
  return predictions.filter((item) => {
    const review = reviews[item.sample.id];
    if (!review) {
      return false;
    }
    const modelCorrect = item.correct;
    const judgedCorrect = review === "model_correct";
    return modelCorrect === judgedCorrect;
  }).length;
}

export function evaluateHyperParams(params: HyperParams, step2Score: number): HyperScore {
  const augmentScore = params.dataAugment ? 1 : 0;
  const layerScore = clamp(1 - (params.layers - 3) ** 2 / 9, 0, 1);
  const learningRateScore = clamp(1 - (params.learningRate - 5) ** 2 / 16, 0, 1);

  const composite = 0.45 * augmentScore + 0.3 * layerScore + 0.25 * learningRateScore;

  const labelNoisePenalty = 0.3 * (1 - step2Score);
  const overfitPenalty =
    0.12 * Math.max(0, params.layers - 3) / 3 +
    0.12 * Math.max(0, params.learningRate - 5) / 4;
  const underfitPenalty =
    0.03 * Math.max(0, 3 - params.layers) / 3 +
    0.03 * Math.max(0, 5 - params.learningRate) / 4;
  const noAugmentPenalty = params.dataAugment ? 0 : 0.02;

  return {
    augmentScore,
    layerScore,
    learningRateScore,
    composite,
    labelNoisePenalty,
    overfitPenalty,
    underfitPenalty,
    noAugmentPenalty,
  };
}

export function calculateFinalScore(input: {
  step2Score: number;
  step4Score: number;
  trainingSetQuality: number;
  secondFieldAccuracy: number;
  params: HyperParams;
}): FinalScore {
  const hyperScore = evaluateHyperParams(input.params, input.step2Score);

  const baseFinalAccuracy =
    0.24 +
    0.2 * input.step2Score +
    0.2 * input.step4Score +
    0.16 * hyperScore.composite +
    0.14 * input.trainingSetQuality +
    0.06 * input.step2Score * input.step4Score;

  const trainingQualityPenalty = 0.1 * (1 - input.trainingSetQuality);

  const penalty =
    hyperScore.labelNoisePenalty +
    hyperScore.overfitPenalty +
    hyperScore.underfitPenalty +
    hyperScore.noAugmentPenalty +
    trainingQualityPenalty;

  const finalAccuracy = clamp(baseFinalAccuracy - penalty, 0.45, 0.9);

  return {
    secondFieldAccuracy: input.secondFieldAccuracy,
    finalAccuracy,
    baseFinalAccuracy,
    hyperScore,
    trainingQualityPenalty,
  };
}

function smoothCurve(start: number, end: number, ratio: number, speed = 4) {
  const eased = 1 - Math.exp(-speed * ratio);
  return start + (end - start) * eased;
}

export function generateLossSeries(input: {
  step2Score: number;
  step4Score: number;
  trainingSetQuality: number;
  finalScore: FinalScore;
  epochs?: number;
}): LossPoint[] {
  const epochs = input.epochs ?? 24;
  const hyper = input.finalScore.hyperScore.composite;
  const overfit = input.finalScore.hyperScore.overfitPenalty;

  const trainStart = clamp(
    1.2 - 0.24 * input.step2Score - 0.16 * hyper - 0.14 * input.trainingSetQuality,
    0.48,
    1.25,
  );
  const trainEnd = clamp(
    0.15 +
      0.2 * (1 - input.step2Score) +
      0.08 * (1 - hyper) +
      0.08 * (1 - input.trainingSetQuality),
    0.12,
    0.55,
  );

  const testStart = clamp(
    1.22 -
      0.2 * input.step2Score -
      0.2 * input.step4Score -
      0.12 * input.trainingSetQuality,
    0.54,
    1.28,
  );
  const testEnd = clamp(
    0.2 +
      0.28 * (1 - (0.5 * input.step2Score + 0.5 * input.step4Score)) +
      0.22 * (1 - hyper) +
      0.1 * (1 - input.trainingSetQuality),
    0.2,
    0.85,
  );

  return Array.from({ length: epochs }, (_, index) => {
    const ratio = index / Math.max(epochs - 1, 1);

    const trainBase = smoothCurve(trainStart, trainEnd, ratio, 4.4);
    const testBase = smoothCurve(testStart, testEnd, ratio, 3.2);

    const noiseScale = 0.5 + 0.28 * (1 - input.trainingSetQuality);

    const trainJitter =
      (Math.sin((index + 1) * 0.85) * 0.012 + Math.cos((index + 1) * 0.35) * 0.009) *
      (0.6 + 0.4 * (1 - hyper)) *
      noiseScale;

    const testJitter =
      (Math.sin((index + 1) * 0.9) * 0.03 + Math.cos((index + 1) * 0.38) * 0.02) *
      (0.5 + overfit * 2.2) *
      noiseScale;

    const overfitDrift = ratio > 0.6 ? (ratio - 0.6) * overfit * 0.55 : 0;

    const trainLoss = clamp(trainBase + trainJitter, 0.08, 1.4);
    const testLoss = clamp(testBase + testJitter + overfitDrift, 0.1, 1.45);

    return {
      epoch: index + 1,
      trainLoss,
      testLoss,
    };
  });
}
