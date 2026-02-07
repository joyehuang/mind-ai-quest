"use client";

import LossChart from "@/components/farm/LossChart";
import { GameBadge, GameButton, GamePanel } from "@/components/ui/GameUI";
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
      <GamePanel variant="strong" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#c7f4ff]">第五步：调超参数 + 第三块田最终测试（防数据泄露）</p>
          <GameBadge variant="success">HYPER TUNING</GameBadge>
        </div>
        <p className="mt-1 text-xs text-[#9ccfe4]">
          最终准确率综合了第二步打标签正确率、第四步纠错正确率、以及当前超参数设置。
        </p>
        <p className="mt-1 text-xs text-[#9ccfe4]">训练集质量：{toPercent(trainingSetQuality)}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="game-surface-soft rounded-xl p-3">
            <p className="text-xs text-[#95cde3]">记忆药水（数据增强）</p>
            <GameButton
              type="button"
              variant={dataAugment ? "success" : "secondary"}
              className="mt-2 w-full px-3 py-2 text-sm font-semibold"
              onClick={() => onDataAugmentChange(!dataAugment)}
            >
              {dataAugment ? "已开启" : "未开启"}
            </GameButton>
          </div>

          <div className="game-surface-soft rounded-xl p-3">
            <p className="text-xs text-[#95cde3]">大脑积木层数：{layers} 层</p>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={layers}
              onChange={(event) => onLayersChange(Number(event.target.value))}
              className="game-range mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#8fbfd6]">3 层附近最稳，太浅欠拟合，太深可能过拟合。</p>
          </div>

          <div className="game-surface-soft rounded-xl p-3">
            <p className="text-xs text-[#95cde3]">学习速度：{learningRate}</p>
            <input
              type="range"
              min={1}
              max={9}
              step={1}
              value={learningRate}
              onChange={(event) => onLearningRateChange(Number(event.target.value))}
              className="game-range mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[#8fbfd6]">5 附近最稳，太小学不动，太大会震荡。</p>
          </div>
        </div>

        <GameButton
          type="button"
          variant="primary"
          className="mt-4 rounded-xl px-4 py-2 text-sm"
          onClick={onRun}
        >
          运行最终测试
        </GameButton>
      </GamePanel>

      {finalResult ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#94cce3]">第二步标签正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#dbf6ff]">{toPercent(step2Score)}</p>
            </article>
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#94cce3]">第四步纠错正确率</p>
              <p className="mt-1 text-xl font-semibold text-[#dbf6ff]">{toPercent(step4Score)}</p>
            </article>
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#94cce3]">第二块田准确率</p>
              <p className="mt-1 text-xl font-semibold text-[#dbf6ff]">
                {toPercent(finalResult.score.secondFieldAccuracy)}
              </p>
            </article>
            <article className="game-surface-card rounded-2xl p-4">
              <p className="text-xs text-[#94cce3]">训练集质量</p>
              <p className="mt-1 text-xl font-semibold text-[#dbf6ff]">{toPercent(trainingSetQuality)}</p>
            </article>
            <article className="rounded-2xl border border-[rgba(106,255,180,0.45)] bg-[rgba(8,49,35,0.74)] p-4">
              <p className="text-xs text-[#9de6c7]">第三块田最终准确率</p>
              <p className="mt-1 text-2xl font-semibold text-[#9dffd5]">
                {toPercent(finalResult.score.finalAccuracy)}
              </p>
            </article>
          </div>

          <div className="game-note rounded-2xl p-4 text-sm">
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
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">TP（病害判病害）：{finalResult.thirdFieldConfusion.tp}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">TN（健康判健康）：{finalResult.thirdFieldConfusion.tn}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">FP（健康判病害）：{finalResult.thirdFieldConfusion.fp}</p>
            <p className="game-surface-soft rounded-xl px-3 py-3 text-sm">FN（病害判健康）：{finalResult.thirdFieldConfusion.fn}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[rgba(66,193,242,0.34)] bg-[rgba(7,22,43,0.84)] p-3">
            <table className="game-table w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(62,165,210,0.3)]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真实标签</th>
                  <th className="px-2 py-2">预测标签</th>
                  <th className="px-2 py-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {finalResult.thirdFieldPredictions.map((item) => (
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
          点击“运行最终测试”后，将展示第三块田准确率和训练/测试 loss 曲线。
        </p>
      )}
    </div>
  );
}
