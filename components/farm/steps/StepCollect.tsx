"use client";

import type { FarmSample } from "@/lib/farm/types";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";

interface StepCollectProps {
  collectedSamples: FarmSample[];
  collectedIds: string[];
  target: number;
  poolSize: number;
  trainingQuality: number;
  hoveredSample: FarmSample | null;
  collectMessage: string;
}

export default function StepCollect({
  collectedSamples,
  collectedIds,
  target,
  poolSize,
  trainingQuality,
  hoveredSample,
  collectMessage,
}: StepCollectProps) {
  const progress = Math.round((collectedIds.length / Math.max(target, 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#b8c8e6] bg-[#edf2ff] p-4">
        <p className="text-sm font-medium text-[#24385d]">第一步：在练习田收集教材</p>
        <p className="mt-1 text-lg font-semibold text-[#1f3358]">
          候选 {poolSize} 株，已挑到 {collectedIds.length}/{target}
        </p>
        <div className="mt-3 h-3 rounded-full bg-[#d8e1f3] p-[2px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6ca9ff] to-[#f2c27a]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#4e5e82]">
          请从 {poolSize} 个候选样本中挑选 {target} 个当教材。教材越丰富，小麦后面在测验田和考试田的表现就越稳。
        </p>
        <p className="mt-1 text-xs text-[#4e5e82]">
          当前{FARM_METAPHOR_LABELS.textbookReadiness}（覆盖度+平衡度）：{Math.round(trainingQuality * 100)}%
        </p>
        {collectMessage && (
          <p className="mt-2 rounded-lg border border-[#e3b77a] bg-[#fff6e8] px-2 py-1 text-xs text-[#8a5b24]">
            {collectMessage}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#d0dbee] bg-white p-4">
        <p className="text-sm font-semibold text-[#263d67]">3D 操作说明</p>
        <p className="mt-2 text-sm text-[#5b6d93]">
          直接在上方 3D 练习田里点击稻株，把它放进或拿出教材篮；鼠标悬停时还能先看线索。
        </p>
        {hoveredSample ? (
          <div className="mt-3 rounded-xl border border-[#c9d6ee] bg-[#f3f7ff] p-3 text-sm text-[#32466d]">
            <p className="font-semibold text-[#243a64]">{hoveredSample.name}</p>
            <p className="mt-1">叶子：{hoveredSample.profile.leaf}</p>
            <p>稻秆：{hoveredSample.profile.stem}</p>
            <p>小稻秆数量：{hoveredSample.profile.tiller}</p>
            <p>虫害：{hoveredSample.profile.pest}</p>
            <p>稻穗：{hoveredSample.profile.panicle}</p>
            <p className="mt-2 text-xs font-semibold text-[#2d4774]">
              当前状态：{collectedIds.includes(hoveredSample.id) ? "已经在教材篮里（再次点击可放回）" : "还没进教材篮（点击可加入）"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6d93]">把鼠标放在 3D 稻株上，会显示这株稻子的完整线索描述。</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#d0dbee] bg-white p-4">
        <p className="text-sm font-semibold text-[#263d67]">已挑好的教材（来自 3D 点击）</p>
        {collectedSamples.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collectedSamples.map((sample) => (
              <div
                key={sample.id}
                className="rounded-xl border border-[#c9d6ef] bg-[#f3f7ff] px-3 py-2 text-sm text-[#33476d]"
              >
                {sample.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6c90]">还没有挑中教材，请在上方 3D 稻田里点击稻株开始收集。</p>
        )}
      </div>
    </div>
  );
}
