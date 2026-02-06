"use client";

import LossChart from "@/components/farm/LossChart";
import { toPercent } from "@/lib/farm/scoring";
import type { FinalSimulationResult } from "@/lib/farm/types";

interface StepTuneFinalProps {
  dataAugment: boolean;
  layers: number;
  learningRate: number;
  onDataAugmentChange: (value: boolean) => void;
  onLayersChange: (value: number) => void;
  onLearningRateChange: (value: number) => void;
  onRun: () => void;
  step2Score: number;
  step4Score: number;
  trainingSetQuality: number;
  finalResult: FinalSimulationResult | null;
}

function labelText(value: "healthy" | "unhealthy") {
  return value === "healthy" ? "健康" : "不健康";
}

export default function StepTuneFinal({
  dataAugment,
  layers,
  learningRate,
  onDataAugmentChange,
  onLayersChange,
  onLearningRateChange,
  onRun,
  step2Score,
  step4Score,
  trainingSetQuality,
  finalResult,
}: StepTuneFinalProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#d2e2d9] bg-white p-4">
        <p className="text-sm font-semibold text-[#274a3a]">第五步：调超参数 + 第三块田最终测试（防数据泄露）</p>
        <p className="mt-1 text-xs text-[#5a7266]">
          最终准确率综合了第二步打标签正确率、第四步纠错正确率、以及当前超参数设置。
        </p>
        <p className="mt-1 text-xs text-[#5a7266]">训练集质量：{toPercent(trainingSetQuality)}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#d4e4dc] bg-[#f8fcf9] p-3">
            <p className="text-xs text-[#5f766b]">记忆药水（数据增强）</p>
            <button
              type="button"
              className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-semibold ${
                dataAugment
                  ? "border-[#4ca778] bg-[#e6f8ee] text-[#1f6f45]"
                  : "border-[#d4dfd8] bg-white text-[#455e51]"
              }`}
              onClick={() => onDataAugmentChange(!dataAugment)}
            >
              {dataAugment ? "已开启" : "未开启"}
            </button>
          </div>

          <div className="rounded-xl border border-[#d4e4dc] bg-[#f8fcf9] p-3">
            <p className="text-xs text-[#5f766b]">大脑积木层数：{layers} 层</p>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={layers}
              onChange={(event) => onLayersChange(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#687f73]">3 层附近最稳，太浅欠拟合，太深可能过拟合。</p>
          </div>

          <div className="rounded-xl border border-[#d4e4dc] bg-[#f8fcf9] p-3">
            <p className="text-xs text-[#5f766b]">学习速度：{learningRate}</p>
            <input
              type="range"
              min={1}
              max={9}
              step={1}
              value={learningRate}
              onChange={(event) => onLearningRateChange(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#687f73]">5 附近最稳，太小学不动，太大会震荡。</p>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 rounded-xl bg-[#1f8a5b] px-4 py-2 text-sm font-semibold text-white"
          onClick={onRun}
        >
          运行最终测试
        </button>
      </div>

      {finalResult ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <article className="rounded-2xl border border-[#d4e4dc] bg-white p-4">
              <p className="text-xs text-[#5f766a]">第二步标签正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#214636]">{toPercent(step2Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d4e4dc] bg-white p-4">
              <p className="text-xs text-[#5f766a]">第四步纠错正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#214636]">{toPercent(step4Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d4e4dc] bg-white p-4">
              <p className="text-xs text-[#5f766a]">第二块田准确率</p>
              <p className="mt-1 text-xl font-semibold text-[#214636]">
                {toPercent(finalResult.score.secondFieldAccuracy)}
              </p>
            </article>
            <article className="rounded-2xl border border-[#d4e4dc] bg-white p-4">
              <p className="text-xs text-[#5f766a]">训练集质量</p>
              <p className="mt-1 text-xl font-semibold text-[#214636]">{toPercent(trainingSetQuality)}</p>
            </article>
            <article className="rounded-2xl border border-[#9ecfb2] bg-[#ecfff3] p-4">
              <p className="text-xs text-[#4d6a5c]">第三块田最终准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#1f7a4d]">
                {toPercent(finalResult.score.finalAccuracy)}
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#d4e4dc] bg-white p-4 text-sm text-[#355646]">
            <p className="font-semibold">公式拆解（连续函数）</p>
            <p className="mt-1">base = 0.24 + 0.20*s2 + 0.20*s4 + 0.16*hyper + 0.14*数据质量 + 0.06*s2*s4</p>
            <p className="mt-1">
              penalty = 标签噪声({finalResult.score.hyperScore.labelNoisePenalty.toFixed(3)}) + 过拟合(
              {finalResult.score.hyperScore.overfitPenalty.toFixed(3)}) + 欠拟合(
              {finalResult.score.hyperScore.underfitPenalty.toFixed(3)}) + 无增强(
              {finalResult.score.hyperScore.noAugmentPenalty.toFixed(3)}) + 训练集惩罚(
              {finalResult.score.trainingQualityPenalty.toFixed(3)})
            </p>
            <p className="mt-1">
              最终 = clamp(base - penalty, 45%, 90%) = {toPercent(finalResult.score.finalAccuracy)}
            </p>
          </div>

          <LossChart points={finalResult.lossPoints} />

          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              TP（病害判病害）：{finalResult.thirdFieldConfusion.tp}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              TN（健康判健康）：{finalResult.thirdFieldConfusion.tn}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              FP（健康判病害）：{finalResult.thirdFieldConfusion.fp}
            </p>
            <p className="rounded-xl border border-[#d6e5dd] bg-white px-3 py-3 text-sm text-[#355646]">
              FN（病害判健康）：{finalResult.thirdFieldConfusion.fn}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#d4e4dc] bg-white p-3">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e1ece6] text-[#506a5d]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真实标签</th>
                  <th className="px-2 py-2">预测标签</th>
                  <th className="px-2 py-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {finalResult.thirdFieldPredictions.map((item) => (
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
        <p className="rounded-xl border border-[#d5e4dc] bg-white px-3 py-3 text-sm text-[#4d665a]">
          点击“运行最终测试”后，将展示第三块田准确率和训练/测试 loss 曲线。
        </p>
      )}
    </div>
  );
}
