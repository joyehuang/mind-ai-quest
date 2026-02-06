import type { ConfusionMetrics, PredictionRecord, RiceLabel } from "./types";

function safeDivide(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

export function oppositeLabel(label: RiceLabel): RiceLabel {
  return label === "healthy" ? "unhealthy" : "healthy";
}

export function toConfusionMetrics(records: PredictionRecord[]): ConfusionMetrics {
  const tp = records.filter(
    (item) => item.sample.groundTruth === "unhealthy" && item.predicted === "unhealthy",
  ).length;
  const tn = records.filter(
    (item) => item.sample.groundTruth === "healthy" && item.predicted === "healthy",
  ).length;
  const fp = records.filter(
    (item) => item.sample.groundTruth === "healthy" && item.predicted === "unhealthy",
  ).length;
  const fn = records.filter(
    (item) => item.sample.groundTruth === "unhealthy" && item.predicted === "healthy",
  ).length;

  const total = records.length;

  return {
    tp,
    tn,
    fp,
    fn,
    accuracy: safeDivide(tp + tn, total),
    precision: safeDivide(tp, tp + fp),
    recall: safeDivide(tp, tp + fn),
  };
}
