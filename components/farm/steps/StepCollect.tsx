"use client";

import type { FarmSample } from "@/lib/farm/types";

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
        <p className="text-sm font-medium text-[#24385d]">第一步：第一块田收集数据（不显示标签）</p>
        <p className="mt-1 text-lg font-semibold text-[#1f3358]">
          候选 {poolSize} 株，已收集 {collectedIds.length}/{target}
        </p>
        <div className="mt-3 h-3 rounded-full bg-[#d8e1f3] p-[2px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6ca9ff] to-[#f2c27a]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#4e5e82]">
          请从 {poolSize} 个候选样本中挑选 {target} 个作为训练集。训练集质量会影响后续测试准确率。
        </p>
        <p className="mt-1 text-xs text-[#4e5e82]">
          当前训练集质量（覆盖度+平衡度）：{Math.round(trainingQuality * 100)}%
        </p>
        {collectMessage && (
          <p className="mt-2 rounded-lg border border-[#e3b77a] bg-[#fff6e8] px-2 py-1 text-xs text-[#8a5b24]">
            {collectMessage}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#d0dbee] bg-white p-4">
        <p className="text-sm font-semibold text-[#263d67]">3D 交互说明</p>
        <p className="mt-2 text-sm text-[#5b6d93]">
          直接在上方 3D 第一块田中点击稻株来加入/移除训练集，鼠标悬停即可查看特征信息。
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
              当前状态：{collectedIds.includes(hoveredSample.id) ? "已加入训练集（再次点击可移除）" : "未加入训练集（点击可加入）"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6d93]">把鼠标放在 3D 稻株上，会显示该稻种的完整特征描述。</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#d0dbee] bg-white p-4">
        <p className="text-sm font-semibold text-[#263d67]">已选训练集（来自 3D 点击）</p>
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
          <p className="mt-3 text-sm text-[#5b6c90]">还没有选中样本，请在上方 3D 稻田中点击稻株开始收集。</p>
        )}
      </div>
    </div>
  );
}
