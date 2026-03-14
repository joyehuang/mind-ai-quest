"use client";

import { useMobile } from "@/components/hooks/useMobile";
import { toPercent } from "@/lib/farm/scoring";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";
import type { ModelJudgment, PredictionRecord } from "@/lib/farm/types";

interface StepCorrectProps {
  predictions: PredictionRecord[];
  reviews: Record<string, ModelJudgment>;
  step4Score: number;
  correctCount: number;
  onReview: (sampleId: string, judgment: ModelJudgment) => void;
}

function labelText(value: "healthy" | "unhealthy") {
  return value === "healthy" ? "健康稻子" : "不健康稻子";
}

export default function StepCorrect({
  predictions,
  reviews,
  step4Score,
  correctCount,
  onReview,
}: StepCorrectProps) {
  const reviewed = Object.keys(reviews).length;
  const { isMobile, windowWidth } = useMobile();

  // 根据屏幕大小调整样式
  const padding = isMobile ? "p-3" : "p-4";
  const gap = isMobile ? "gap-2" : "gap-3";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#c8d5ec] bg-[#f2f6ff] p-4">
        <p className="text-sm font-semibold text-[#284067]">第四步：检查小麦的测验答案</p>
        <p className="mt-1 text-xs text-[#5f7097]">
          来看看小麦在测验田的表现吧！当小麦猜错时，请你帮忙纠正它。你的每一次纠正，都会让小麦的判断变得更准确。
        </p>
        <p className="mt-2 text-sm text-[#3e5178]">
          检查进度：{reviewed}/{predictions.length}，检查答对率：{toPercent(step4Score)}（{correctCount}/{predictions.length}）
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {predictions.map((item) => {
          const choice = reviews[item.sample.id];
          return (
            <article key={item.sample.id} className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-sm font-semibold text-[#284067]">{item.sample.name}</p>
              <p className="mt-1 text-xs text-[#66779f]">{FARM_METAPHOR_LABELS.guess}：{labelText(item.predicted)}</p>
              <p className="mt-1 text-xs text-[#66779f]">真正情况：{labelText(item.sample.groundTruth)}</p>

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
                  这次猜对了
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
                  这次猜错了
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
