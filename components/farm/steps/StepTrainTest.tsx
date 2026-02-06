"use client";

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
      <div className="rounded-2xl border border-[#c0dac9] bg-[#effcf5] p-4">
        <p className="text-sm font-semibold text-[#284c3c]">第三步：神经网络训练并测试第二块田</p>
        <p className="mt-1 text-xs text-[#4e6a5d]">
          第二步标注正确率：{toPercent(step2Score)}（错误 {step2Errors} 个）
        </p>
        <p className="mt-1 text-xs text-[#4e6a5d]">训练集质量：{toPercent(trainingSetQuality)}</p>
        <p className="mt-1 text-xs text-[#4e6a5d]">
          公式：acc2 = clamp(0.38 + 0.30*s2 + 0.24*训练集质量, 45%, 85%)
        </p>

        <div className="mt-3 h-4 rounded-full bg-[#d8e9df] p-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2a9763] to-[#7dcc93]"
            style={{ width: `${Math.min(trainProgress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-[#1f8554]">训练进度：{trainProgress}%</p>
      </div>

      {done ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#d4e5dc] bg-white p-4">
              <p className="text-xs text-[#5c7568]">第二块田准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#1f6845]">{toPercent(confusion.accuracy)}</p>
            </article>
            <article className="rounded-2xl border border-[#d4e5dc] bg-white p-4">
              <p className="text-xs text-[#5c7568]">病害召回率</p>
              <p className="mt-1 text-2xl font-semibold text-[#1f6845]">{toPercent(confusion.recall)}</p>
            </article>
            <article className="rounded-2xl border border-[#d4e5dc] bg-white p-4">
              <p className="text-xs text-[#5c7568]">理论目标准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#1f6845]">{toPercent(targetAccuracy)}</p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#d4e4dc] bg-[#f8fcf9] p-4 text-sm text-[#2f4d3e]">
            准确率计算：预测正确数 / 测试总数 = {predictions.filter((item) => item.correct).length} /
            {" "}
            {predictions.length} = {toPercent(confusion.accuracy)}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              TP（病害判病害）：{confusion.tp}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              TN（健康判健康）：{confusion.tn}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              FP（健康判病害）：{confusion.fp}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              FN（病害判健康）：{confusion.fn}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#d4e4dc] bg-white p-3">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e1ece6] text-[#506a5d]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真实标签</th>
                  <th className="px-2 py-2">模型预测</th>
                  <th className="px-2 py-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((item) => (
                  <tr key={item.sample.id} className="border-b border-[#edf4f0] text-[#2f4d3f]">
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
        <p className="rounded-xl border border-[#d2e2d9] bg-white px-3 py-3 text-sm text-[#3a5a4b]">
          模型正在学习第一块田的标注数据，训练完成后将自动展示第二块田预测结果。
        </p>
      )}
    </div>
  );
}
