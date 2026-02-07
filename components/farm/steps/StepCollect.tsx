"use client";

import { GameBadge, GamePanel, GameProgress } from "@/components/ui/GameUI";
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
      <GamePanel variant="soft" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#93def7]">第一步：第一块田收集数据（不显示标签）</p>
          <GameBadge variant="info">DATA GATHERING</GameBadge>
        </div>
        <p className="mt-1 text-lg font-semibold text-[#d7f6ff]">
          候选 {poolSize} 株，已收集 {collectedIds.length}/{target}
        </p>
        <GameProgress value={Math.min(progress, 100)} className="mt-3" />
        <p className="mt-2 text-xs text-[#8dc4dd]">
          请从 {poolSize} 个候选样本中挑选 {target} 个作为训练集。训练集质量会影响后续测试准确率。
        </p>
        <p className="mt-1 text-xs text-[#8dc4dd]">
          当前训练集质量（覆盖度+平衡度）：{Math.round(trainingQuality * 100)}%
        </p>
        {collectMessage && (
          <p className="mt-2 rounded-lg border border-[rgba(255,195,106,0.52)] bg-[rgba(54,37,12,0.78)] px-2 py-1 text-xs text-[#ffdba8]">
            {collectMessage}
          </p>
        )}
      </GamePanel>

      <GamePanel variant="soft" className="p-4">
        <p className="text-sm font-semibold text-[#a5e7ff]">3D 交互说明</p>
        <p className="mt-2 text-sm text-[#9acbe2]">
          直接在上方 3D 第一块田中点击稻株来加入/移除训练集，鼠标悬停即可查看特征信息。
        </p>
        {hoveredSample ? (
          <div className="game-surface-soft mt-3 rounded-xl p-3 text-sm text-[#b8e9ff]">
            <p className="font-semibold text-[#d5f6ff]">{hoveredSample.name}</p>
            <p className="mt-1">叶子：{hoveredSample.profile.leaf}</p>
            <p>稻秆：{hoveredSample.profile.stem}</p>
            <p>小稻秆数量：{hoveredSample.profile.tiller}</p>
            <p>虫害：{hoveredSample.profile.pest}</p>
            <p>稻穗：{hoveredSample.profile.panicle}</p>
            <p className="mt-2 text-xs font-semibold text-[#8ee5ff]">
              当前状态：{collectedIds.includes(hoveredSample.id) ? "已加入训练集（再次点击可移除）" : "未加入训练集（点击可加入）"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9acbe2]">把鼠标放在 3D 稻株上，会显示该稻种的完整特征描述。</p>
        )}
      </GamePanel>

      <GamePanel variant="soft" className="p-4">
        <p className="text-sm font-semibold text-[#a5e7ff]">已选训练集（来自 3D 点击）</p>
        {collectedSamples.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collectedSamples.map((sample) => (
              <div
                key={sample.id}
                className="game-surface-soft rounded-xl px-3 py-2 text-sm text-[#c7f0ff]"
              >
                {sample.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9acbe2]">还没有选中样本，请在上方 3D 稻田中点击稻株开始收集。</p>
        )}
      </GamePanel>
    </div>
  );
}
