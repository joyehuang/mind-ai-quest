"use client";

import { GameBadge, GameButton, GamePanel } from "@/components/ui/GameUI";
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
      <GamePanel variant="soft" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#afeaff]">第四步：纠错第二块田预测并做增量训练</p>
          <GameBadge variant="warning">REVIEW LOOP</GameBadge>
        </div>
        <p className="mt-1 text-xs text-[#94cbe2]">
          你需要判断“模型这次判断对不对”，系统会把第二块田数据并入训练池。
        </p>
        <p className="mt-2 text-sm text-[#b8ecff]">
          纠错进度：{reviewed}/{predictions.length}，纠错准确率：{toPercent(step4Score)}（{correctCount}/
          {predictions.length}）
        </p>
      </GamePanel>

      <div className="grid gap-3 md:grid-cols-2">
        {predictions.map((item) => {
          const choice = reviews[item.sample.id];
          return (
            <article key={item.sample.id} className="game-surface-card rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#d4f5ff]">{item.sample.name}</p>
              <p className="mt-1 text-xs text-[#9acce3]">模型预测：{labelText(item.predicted)}</p>
              <p className="mt-1 text-xs text-[#9acce3]">真实标签：{labelText(item.sample.groundTruth)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <GameButton
                  type="button"
                  variant="primary"
                  className={`px-3 py-2 text-sm ${
                    choice === "model_correct"
                      ? ""
                      : "border-[rgba(82,195,240,0.48)] bg-[rgba(7,26,48,0.84)] text-[#9ed8f0]"
                  }`}
                  onClick={() => onReview(item.sample.id, "model_correct")}
                >
                  模型判断对
                </GameButton>
                <GameButton
                  type="button"
                  variant="secondary"
                  className={`px-3 py-2 text-sm ${
                    choice === "model_wrong"
                      ? "border-[rgba(255,154,121,0.62)] bg-[rgba(84,36,24,0.84)] text-[#ffd3bf]"
                      : "border-[rgba(82,195,240,0.48)] bg-[rgba(7,26,48,0.84)] text-[#9ed8f0]"
                  }`}
                  onClick={() => onReview(item.sample.id, "model_wrong")}
                >
                  模型判断错
                </GameButton>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
