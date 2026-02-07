"use client";

import { GameBadge, GamePanel, GameProgress } from "@/components/ui/GameUI";
import { toPercent } from "@/lib/farm/scoring";
import type { ConfusionMetrics, PredictionRecord } from "@/lib/farm/types";

interface StepTrainTestProps {
  trainProgress: number;
  step2Score: number;
  step2Errors: number;
  trainingSetQuality: number;
  targetAccuracy: number;
  predictions: PredictionRecord[];
  confusion: ConfusionMetrics;
}

function labelText(value: "healthy" | "unhealthy") {
  return value === "healthy" ? "健康" : "不健康";
}

export default function StepTrainTest({
  trainProgress,
  step2Score,
  step2Errors,
  trainingSetQuality,
  targetAccuracy,
  predictions,
  confusion,
}: StepTrainTestProps) {
  const done = trainProgress >= 100;

  return (
    <div className="space-y-4">
      <GamePanel variant="soft" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#afeaff]">第三步：神经网络训练并测试第二块田</p>
          <GameBadge variant="success">TRAIN + TEST</GameBadge>
        </div>
        <p className="mt-1 text-xs text-[#94cbe2]">
          第二步标注正确率：{toPercent(step2Score)}（错误 {step2Errors} 个）
        </p>
        <p className="mt-1 text-xs text-[#94cbe2]">训练集质量：{toPercent(trainingSetQuality)}</p>
        <p className="mt-1 text-xs text-[#94cbe2]">
          公式：acc2 = clamp(0.38 + 0.30*s2 + 0.24*训练集质量, 45%, 85%)
        </p>

        <GameProgress value={Math.min(trainProgress, 100)} className="mt-3 h-4" />
        <p className="mt-2 text-sm font-semibold text-[#9be7ff]">训练进度：{trainProgress}%</p>
      </GamePanel>

      {done ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#8ec7de]">第二块田准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#d8f6ff]">{toPercent(confusion.accuracy)}</p>
            </article>
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#8ec7de]">病害召回率</p>
              <p className="mt-1 text-2xl font-semibold text-[#d8f6ff]">{toPercent(confusion.recall)}</p>
            </article>
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#8ec7de]">理论目标准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#d8f6ff]">{toPercent(targetAccuracy)}</p>
            </article>
          </div>

          <div className="game-note rounded-2xl p-4 text-sm">
            准确率计算：预测正确数 / 测试总数 = {predictions.filter((item) => item.correct).length} /{" "}
            {predictions.length} = {toPercent(confusion.accuracy)}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">TP（病害判病害）：{confusion.tp}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">TN（健康判健康）：{confusion.tn}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">FP（健康判病害）：{confusion.fp}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">FN（病害判健康）：{confusion.fn}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[rgba(66,193,242,0.34)] bg-[rgba(7,22,43,0.84)] p-3">
            <table className="game-table w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(62,165,210,0.3)]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真实标签</th>
                  <th className="px-2 py-2">模型预测</th>
                  <th className="px-2 py-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((item) => (
                  <tr key={item.sample.id} className="border-b border-[rgba(62,165,210,0.2)]">
                    <td className="px-2 py-2">{item.sample.name}</td>
                    <td className="px-2 py-2">{labelText(item.sample.groundTruth)}</td>
                    <td className="px-2 py-2">{labelText(item.predicted)}</td>
                    <td className="px-2 py-2">{item.correct ? "正确" : "错误"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="game-surface-soft rounded-xl px-3 py-3 text-sm text-[#9ccde2]">
          模型正在学习第一块田的标注数据，训练完成后将自动展示第二块田预测结果。
        </p>
      )}
    </div>
  );
}
