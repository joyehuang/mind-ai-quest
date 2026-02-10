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
      <div className="rounded-2xl border border-[#c8d5ec] bg-[#f2f6ff] p-4">
        <p className="text-sm font-semibold text-[#284067]">第四步：纠错第二块田预测并做增量训练</p>
        <p className="mt-1 text-xs text-[#5f7097]">
          你需要判断“模型这次判断对不对”，系统会把第二块田数据并入训练池。
        </p>
        <p className="mt-2 text-sm text-[#3e5178]">
          纠错进度：{reviewed}/{predictions.length}，纠错准确率：{toPercent(step4Score)}（{correctCount}/
          {predictions.length}）
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {predictions.map((item) => {
          const choice = reviews[item.sample.id];
          return (
            <article key={item.sample.id} className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-sm font-semibold text-[#284067]">{item.sample.name}</p>
              <p className="mt-1 text-xs text-[#66779f]">模型预测：{labelText(item.predicted)}</p>
              <p className="mt-1 text-xs text-[#66779f]">真实标签：{labelText(item.sample.groundTruth)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    choice === "model_correct"
                      ? "border-[#78a8e8] bg-[#ebf2ff] text-[#2a4f8f]"
                      : "border-[#d3dcef] bg-[#f5f8ff] text-[#3f527c]"
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
                      : "border-[#d3dcef] bg-[#f5f8ff] text-[#3f527c]"
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
