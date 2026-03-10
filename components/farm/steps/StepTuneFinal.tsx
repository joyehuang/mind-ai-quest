"use client";

import LossChart from "@/components/farm/LossChart";
import { toPercent } from "@/lib/farm/scoring";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";
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
  return value === "healthy" ? "健康稻子" : "不健康稻子";
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
        <p className="text-sm font-semibold text-[#274066]">第五步：给小麦加技能，再去第三块田毕业考</p>
        <p className="mt-1 text-xs text-[#60729b]">
          毕业考成绩会综合你前面贴贴纸的表现、检查猜测的表现，还有现在给小麦选的技能搭配。
        </p>
        <p className="mt-1 text-xs text-[#60729b]">{FARM_METAPHOR_LABELS.textbookReadiness}：{toPercent(trainingSetQuality)}</p>

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
              记忆药水
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
            <p className="mt-1 text-[11px] text-[#6f81a8]">3 层附近最合适，太少会想得简单，太多容易把自己绕晕。</p>
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
            <p className="mt-1 text-[11px] text-[#6f81a8]">5 附近最合适，太慢容易学不牢，太快容易看漏答案。</p>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 rounded-xl bg-[#2d4f8d] px-4 py-2 text-sm font-semibold text-[#f4f8ff]"
          onClick={onRun}
        >
          带小麦参加第三块田毕业考
        </button>
      </div>

      {finalResult ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">贴贴纸答对率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(step2Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">检查答对率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(step4Score)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">第二块田答对率</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">
                {toPercent(finalResult.score.secondFieldAccuracy)}
              </p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#66779f]">{FARM_METAPHOR_LABELS.textbookReadiness}</p>
              <p className="mt-1 text-xl font-semibold text-[#294f89]">{toPercent(trainingSetQuality)}</p>
            </article>
            <article className="rounded-2xl border border-[#e0bf84] bg-[#fff6e8] p-4">
              <p className="text-xs text-[#835d2d]">第三块田毕业考答对率</p>
              <p className="mt-1 text-2xl font-semibold text-[#9a6424]">
                {toPercent(finalResult.score.finalAccuracy)}
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#d0dbee] bg-white p-4 text-sm leading-7 text-[#3c4f79]">
            你给小麦选的技能，会影响它在新稻田里会不会更稳。毕业考答对率越高，说明小麦越会把学到的办法带去新地方使用。
          </div>

          <LossChart points={finalResult.lossPoints} />

          <div className="overflow-x-auto rounded-2xl border border-[#d0dbee] bg-white p-3">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#dee5f3] text-[#596d97]">
                  <th className="px-2 py-2">样本</th>
                  <th className="px-2 py-2">真正情况</th>
                  <th className="px-2 py-2">小麦的猜测</th>
                  <th className="px-2 py-2">这题结果</th>
                </tr>
              </thead>
              <tbody>
                {finalResult.thirdFieldPredictions.map((item) => (
                  <tr key={item.sample.id} className="border-b border-[#edf2fa] text-[#394b73]">
                    <td className="px-2 py-2">{item.sample.name}</td>
                    <td className="px-2 py-2">{labelText(item.sample.groundTruth)}</td>
                    <td className="px-2 py-2">{labelText(item.predicted)}</td>
                    <td className="px-2 py-2">{item.correct ? "答对了" : "答错了"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-[#d1dbee] bg-white px-3 py-3 text-sm text-[#556995]">
          点击按钮后，会展示第三块田的毕业考成绩和小麦的迷糊程度变化。
        </p>
      )}
    </div>
  );
}
