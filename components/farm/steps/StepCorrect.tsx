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
  const { isMobile } = useMobile();

  // 移动端：卡片式布局，一次一个
  if (isMobile) {
    const activeIndex = Math.min(reviewed, predictions.length - 1);
    const currentItem = predictions[activeIndex];
    const currentChoice = currentItem ? reviews[currentItem.sample.id] : null;

    return (
      <div className="flex flex-col">
        {/* 进度条 */}
        <div className="mb-3 rounded-xl border border-[#d0dbee] bg-[#f2f6ff] p-3">
          <p className="text-xs font-semibold text-[#284067]">第四步：检查小麦的测验</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#5f7097]">检查进度</span>
            <span className="text-xs font-semibold text-[#355f9f]">{reviewed}/{predictions.length}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#d8e2f4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6ea9ff] to-[#f2c27a]"
              style={{ width: `${Math.min((reviewed / predictions.length) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 当前卡片 */}
        {currentItem ? (
          <div className="rounded-2xl border border-[#d0dbee] bg-white p-4">
            <p className="text-sm font-semibold text-[#284067]">{currentItem.sample.name}</p>

            <div className="mt-3 space-y-2 rounded-xl border border-[#cdd8ee] bg-[#f9fbff] p-3 text-xs text-[#4a5c84]">
              <div className="flex justify-between">
                <span>真正情况：</span>
                <span className="font-semibold">{labelText(currentItem.sample.groundTruth)}</span>
              </div>
              <div className="flex justify-between">
                <span>小麦猜测：</span>
                <span className="font-semibold">{labelText(currentItem.predicted)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  currentChoice === "model_correct"
                    ? "border-[#78a8e8] bg-[#ebf2ff] text-[#2a4f8f]"
                    : "border-[#d3dcef] bg-white text-[#3f527c] hover:bg-[#f5f8ff]"
                }`}
                onClick={() => onReview(currentItem.sample.id, "model_correct")}
              >
                答对了
              </button>
              <button
                type="button"
                className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  currentChoice === "model_wrong"
                    ? "border-[#d88572] bg-[#fff1ed] text-[#a14a35]"
                    : "border-[#d3dcef] bg-white text-[#3f527c] hover:bg-[#f5f8ff]"
                }`}
                onClick={() => onReview(currentItem.sample.id, "model_wrong")}
              >
                答错了
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-[#60749a]">全部检查完成！</p>
        )}

        {/* 导航点 */}
        <div className="mt-4 flex justify-center gap-1.5">
          {predictions.map((item, index) => {
            const choice = reviews[item.sample.id];
            const isCurrent = index === activeIndex;
            return (
              <button
                key={item.sample.id}
                className={`h-1.5 rounded-full transition-all ${
                  isCurrent
                    ? "w-6 bg-[#6ba8ff]"
                    : choice
                      ? "w-1.5 bg-[#78a8e8]"
                      : "w-1.5 bg-[#ccd7ec]"
                }`}
                onClick={() => {
                  if (reviews[item.sample.id]) {
                    onReview(item.sample.id, choice!);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 桌面端布局
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
