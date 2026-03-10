export type RiceLabel = "healthy" | "unhealthy";

export type FarmField = "A" | "B" | "C";

export interface FeatureProfile {
  leaf: string;
  stem: string;
  tiller: string;
  pest: string;
  panicle: string;
}

export interface FarmSample {
  id: string;
  name: string;
  field: FarmField;
  groundTruth: RiceLabel;
  profile: FeatureProfile;
  // Sample clarity/informativeness used to model training-set quality.
  qualityWeight: number;
}

export interface PredictionRecord {
  sample: FarmSample;
  predicted: RiceLabel;
  correct: boolean;
}

export interface ConfusionMetrics {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
}

export interface HyperParams {
  dataAugment: boolean;
  layers: number;
  learningRate: number;
}

export interface HyperScore {
  augmentScore: number;
  layerScore: number;
  learningRateScore: number;
  composite: number;
  labelNoisePenalty: number;
  overfitPenalty: number;
  underfitPenalty: number;
  noAugmentPenalty: number;
}

export interface FinalScore {
  secondFieldAccuracy: number;
  finalAccuracy: number;
  baseFinalAccuracy: number;
  hyperScore: HyperScore;
  trainingQualityPenalty: number;
}

export interface LossPoint {
  epoch: number;
  trainLoss: number;
  testLoss: number;
}

export type ModelJudgment = "model_correct" | "model_wrong";

export interface FinalSimulationResult {
  score: FinalScore;
  thirdFieldPredictions: PredictionRecord[];
  thirdFieldConfusion: ConfusionMetrics;
}

export interface TrainingSetQuality {
  coverage: number;
  balance: number;
  quality: number;
}
