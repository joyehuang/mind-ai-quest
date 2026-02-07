export type ArchiveStep = 0 | 1 | 2 | 3 | 4;

export type SensorKey = "tilt" | "humidity" | "temperature";

export interface DaySensorPoint {
  day: number;
  tilt: number;
  humidity: number;
  temperature: number;
  anomaly: boolean;
}

export interface MonitorPoint {
  day: number;
  tilt: number;
  humidity: number;
  temperature: number;
  realAnomaly: boolean;
  deviation: number;
}

export interface BaselineRange {
  start: number;
  end: number;
}

export type SensitivityLevel = "relaxed" | "balanced" | "strict";

export interface BaselineStats {
  meanTilt: number;
  stdTilt: number;
  meanHumidity: number;
  stdHumidity: number;
  meanTemperature: number;
  stdTemperature: number;
  containsAnomaly: boolean;
  qualityScore: number;
}

export interface MonitorPrediction {
  day: number;
  predictedAnomaly: boolean;
  score: number;
  point: MonitorPoint;
}

export interface MonitorEval {
  predictions: MonitorPrediction[];
  alertsRaised: number;
  trueAnomalies: number;
  falseAlarms: number;
  misses: number;
  accuracy: number;
}

export interface Step1Record {
  daysViewed: number;
  sensorsExplored: SensorKey[];
  timeSpent: number;
}

export interface Step2Record {
  baselineStart: number;
  baselineEnd: number;
  baselineLength: number;
  containsAnomaly: boolean;
  timeSpent: number;
}

export interface Step4Record {
  alertsRaised: number;
  trueAnomalies: number;
  falseAlarms: number;
  accuracy: number;
  timeSpent: number;
}

export interface Step5Record {
  baselineUpdated: boolean;
  sensitivityLevel: SensitivityLevel;
  finalAccuracy: number;
  timeSpent: number;
}
