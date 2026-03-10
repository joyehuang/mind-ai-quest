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
  activeHint: "augment" | "layers" | "learningRate" | null;
  onExplain: (hint: "augment" | "layers" | "learningRate") => void;
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
  activeHint,
  onExplain,
}: StepTuneFinalProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#cfd8ec] bg-white p-4">
        <p className="text-sm font-semibold text-[#274066]">第五步：调超参数 + 第三块田最终测试（防数据泄露）</p>
        <p className="mt-1 text-xs text-[#60729b]">
          最终准确率综合了第二步打标签正确率、第四步纠错正确率、以及当前超参数设置。
        </p>
        <p className="mt-1 text-xs text-[#60729b]">训练集质量：{toPercent(trainingSetQuality)}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div
            className={`rounded-xl border p-3 ${
              activeHint === "augment" ? "border-[#8dbeff] bg-[#edf4ff]" : "border-[#d1dbee] bg-[#f5f8ff]"
            }`}
          >
            <button
              type="button"
              className="text-left text-xs font-semibold text-[#4b6492]"
              onClick={() => onExplain("augment")}
            >
              记忆药水（数据增强）
            </button>
            <button
              type="button"
              className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-semibold ${
                dataAugment
                  ? "border-[#78a8e8] bg-[#ebf2ff] text-[#2a4f8f]"
                  : "border-[#d3dcef] bg-white text-[#4b5f87]"
              }`}
              onClick={() => onDataAugmentChange(!dataAugment)}
            >
              {dataAugment ? "已开启" : "未开启"}
            </button>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              activeHint === "layers" ? "border-[#8dbeff] bg-[#edf4ff]" : "border-[#d1dbee] bg-[#f5f8ff]"
            }`}
          >
            <button
              type="button"
              className="text-left text-xs font-semibold text-[#4b6492]"
              onClick={() => onExplain("layers")}
            >
              大脑积木层数：{layers} 层
            </button>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={layers}
              onChange={(event) => onLayersChange(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#6f81a8]">3 层附近最稳，太浅欠拟合，太深可能过拟合。</p>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              activeHint === "learningRate" ? "border-[#8dbeff] bg-[#edf4ff]" : "border-[#d1dbee] bg-[#f5f8ff]"
            }`}
          >
            <button
              type="button"
              className="text-left text-xs font-semibold text-[#4b6492]"
              onClick={() => onExplain("learningRate")}
            >
              学习速度：{learningRate}
            </button>
            <input
              type="range"
              min={1}
              max={9}
              step={1}
              value={learningRate}
              onChange={(event) => onLearningRateChange(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#6f81a8]">5 附近最稳，太小学不动，太大会震荡。</p>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 rounded-xl bg-[#2d4f8d] px-4 py-2 text-sm font-semibold text-[#f4f8ff]"
          onClick={onRun}
        >
          运行最终测试
        </button>
      </div>

      {finalResult ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">第二步标签正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(step2Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">第四步纠错正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(step4Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">第二块田准确率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">
                {toPercent(finalResult.score.secondFieldAccuracy)}
              </p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">训练集质量</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(trainingSetQuality)}</p>
            </article>
            <article className="rounded-2xl border border-[#e0bf84] bg-[#fff6e8] p-4">
              <p className="text-xs text-[#835d2d]">第三块田最终准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#9a6424]">
                {toPercent(finalResult.score.finalAccuracy)}
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#d0dbee] bg-white p-4 text-sm text-[#3c4f79]">
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
            <p className="rounded-xl border border-[#d2dcee] bg-white px-3 py-3 text-sm text-[#3c4f78]">
              TP（病害判病害）：{finalResult.thirdFieldConfusion.tp}
            </p>
            <p className="rounded-xl border border-[#d2dcee] bg-white px-3 py-3 text-sm text-[#3c4f78]">
              TN（健康判健康）：{finalResult.thirdFieldConfusion.tn}
            </p>
            <p className="rounded-xl border border-[#d2dcee] bg-white px-3 py-3 text-sm text-[#3c4f78]">
              FP（健康判病害）：{finalResult.thirdFieldConfusion.fp}
            </p>
            <p className="rounded-xl border border-[#d2dcee] bg-white px-3 py-3 text-sm text-[#3c4f78]">
              FN（病害判健康）：{finalResult.thirdFieldConfusion.fn}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#d0dbee] bg-white p-3">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#dee5f3] text-[#596d97]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真实标签</th>
                  <th className="px-2 py-2">预测标签</th>
                  <th className="px-2 py-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {finalResult.thirdFieldPredictions.map((item) => (
                  <tr key={item.sample.id} className="border-b border-[#edf2fa] text-[#394b73]">
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
        <p className="rounded-xl border border-[#d1dbee] bg-white px-3 py-3 text-sm text-[#556995]">
          点击“运行最终测试”后，将展示第三块田准确率和训练/测试 loss 曲线。
        </p>
      )}
    </div>
  );
}
