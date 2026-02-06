"use client";

import { toPercent } from "@/lib/farm/scoring";
import type { ModelJudgment, PredictionRecord } from "@/lib/farm/types";

interface StepCorrectProps {
  predictions: PredictionRecord[];
  reviews: Record<string, ModelJudgment>;
  step4Score: number;
  correctCount: number;
  onReview: (sampleId: string, judgment: ModelJudgment) => void;
}

function labelText(value: "healthy" | "unhealthy") {
  return value === "healthy" ? "健康" : "不健康";
}

export default function StepCorrect({
  predictions,
  reviews,
  step4Score,
  correctCount,
  onReview,
}: StepCorrectProps) {
  const reviewed = Object.keys(reviews).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#d0dfd6] bg-[#f7fcf9] p-4">
        <p className="text-sm font-semibold text-[#27493a]">第四步：纠错第二块田预测并做增量训练</p>
        <p className="mt-1 text-xs text-[#587267]">
          你需要判断“模型这次判断对不对”，系统会把第二块田数据并入训练池。
        </p>
        <p className="mt-2 text-sm text-[#36584a]">
          纠错进度：{reviewed}/{predictions.length}，纠错准确率：{toPercent(step4Score)}（{correctCount}/
          {predictions.length}）
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {predictions.map((item) => {
          const choice = reviews[item.sample.id];
          return (
            <article key={item.sample.id} className="rounded-2xl border border-[#d5e4dc] bg-white p-4">
              <p className="text-sm font-semibold text-[#27493a]">{item.sample.name}</p>
              <p className="mt-1 text-xs text-[#60776b]">模型预测：{labelText(item.predicted)}</p>
              <p className="mt-1 text-xs text-[#60776b]">真实标签：{labelText(item.sample.groundTruth)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    choice === "model_correct"
                      ? "border-[#67b488] bg-[#e8f9ef] text-[#1f7549]"
                      : "border-[#cfe0d6] bg-[#f8fbf9] text-[#38584a]"
                  }`}
                  onClick={() => onReview(item.sample.id, "model_correct")}
                >
                  模型判断对
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    choice === "model_wrong"
                      ? "border-[#d88572] bg-[#fff1ed] text-[#a14a35]"
                      : "border-[#cfe0d6] bg-[#f8fbf9] text-[#38584a]"
                  }`}
                  onClick={() => onReview(item.sample.id, "model_wrong")}
                >
                  模型判断错
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
