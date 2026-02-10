export type DetectionLabel = "normal" | "anomaly";

export type WenshugeFeatureKey =
  | "tiltAngle"
  | "wallWeathering"
  | "crackWidth"
  | "tileDropCount"
  | "moistureLevel"
  | "weekdayIndex"
  | "airTemperature"
  | "visitorFlow"
  | "festivalFlag"
  | "guardShiftId";

export interface WenshugeFeatureDefinition {
  key: WenshugeFeatureKey;
  label: string;
  unit: string;
  isRelevant: boolean;
  description: string;
}

export type FeatureValues = Record<WenshugeFeatureKey, number>;

export interface WenshugeDayRecord {
  day: number;
  values: FeatureValues;
  truth: DetectionLabel;
  sensorError: boolean;
  note: string;
}

export interface WenshugeScoredRecord extends WenshugeDayRecord {
  score: number;
  predicted: DetectionLabel;
}

export interface WenshugeMetrics {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
}

export interface WenshugeSimulationConfig {
  selectedFeatureKeys: WenshugeFeatureKey[];
  standardize: boolean;
  dropSensorErrors: boolean;
  threshold: number;
}

export interface WenshugeSimulationResult {
  selectedRelevant: number;
  selectedIrrelevant: number;
  qualityScore: number;
  trainingReferenceDays: number;
  trainRows: WenshugeScoredRecord[];
  testRows: WenshugeScoredRecord[];
  trainMetrics: WenshugeMetrics;
  testMetrics: WenshugeMetrics;
}
