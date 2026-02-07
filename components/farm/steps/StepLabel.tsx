"use client";

import { GameBadge, GameButton, GamePanel } from "@/components/ui/GameUI";
import type { FarmSample, RiceLabel } from "@/lib/farm/types";

interface StepLabelProps {
  samples: FarmSample[];
  labels: Record<string, RiceLabel>;
  activeSampleId: string | null;
  onFocusSample: (sampleId: string) => void;
  onLabel: (sampleId: string, label: RiceLabel) => void;
}

function labelText(label: RiceLabel) {
  return label === "healthy" ? "健康" : "不健康";
}

export default function StepLabel({
  samples,
  labels,
  activeSampleId,
  onFocusSample,
  onLabel,
}: StepLabelProps) {
  const activeSample = samples.find((sample) => sample.id === activeSampleId) ?? samples[0] ?? null;
  const labeledCount = samples.filter((sample) => labels[sample.id] !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <GamePanel variant="soft" className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#a7e9ff]">已收集样本</p>
            <GameBadge variant="info">{labeledCount}/{samples.length}</GameBadge>
          </div>
          <p className="mt-1 text-xs text-[#8fc9df]">标注进度</p>

          <div className="mt-3 space-y-2">
            {samples.map((sample) => {
              const current = labels[sample.id];
              const focused = activeSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    focused
                      ? "border-[rgba(84,235,255,0.54)] bg-[rgba(14,56,90,0.88)] text-[#d5f6ff]"
                      : "border-[rgba(73,150,190,0.34)] bg-[rgba(9,28,50,0.75)] text-[#9dd3ea]"
                  }`}
                  onClick={() => onFocusSample(sample.id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{sample.name}</span>
                    <span className="text-xs text-[#9dcbe0]">{current ? labelText(current) : "?"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </GamePanel>

        <GamePanel variant="strong" className="p-4">
          {activeSample ? (
            <>
              <p className="text-sm font-semibold text-[#b6eeff]">第二步：人工打标签</p>
              <p className="mt-1 text-xs text-[#8fc9df]">根据特征判断健康状态，再给样本贴标签。</p>

              <div className="game-surface-card mt-4 rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#d5f6ff]">{activeSample.name}</p>
                <div className="mt-3 flex items-center justify-center">
                  <div
                    className={`relative flex h-36 w-36 items-center justify-center rounded-full border-2 text-3xl font-bold ${
                      labels[activeSample.id] === "healthy"
                        ? "border-[rgba(106,255,180,0.62)] bg-[rgba(13,67,42,0.72)] text-[#95ffd4]"
                        : labels[activeSample.id] === "unhealthy"
                          ? "border-[rgba(255,145,109,0.68)] bg-[rgba(74,31,22,0.72)] text-[#ffc7ab]"
                          : "border-[rgba(121,159,185,0.54)] bg-[rgba(24,41,57,0.78)] text-[#a1b7c9]"
                    }`}
                  >
                    {labels[activeSample.id] ? (labels[activeSample.id] === "healthy" ? "健" : "病") : "?"}
                  </div>
                </div>

                <div className="game-surface-soft mt-4 rounded-xl p-3 text-sm text-[#b7e7ff]">
                  <p>叶子：{activeSample.profile.leaf}</p>
                  <p>稻秆：{activeSample.profile.stem}</p>
                  <p>小稻秆数量：{activeSample.profile.tiller}</p>
                  <p>虫害：{activeSample.profile.pest}</p>
                  <p>稻穗：{activeSample.profile.panicle}</p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <GameButton
                    type="button"
                    variant="secondary"
                    className="border-[rgba(255,145,109,0.64)] bg-[rgba(70,31,23,0.8)] px-3 py-3 text-sm font-semibold text-[#ffc9b0]"
                    onClick={() => onLabel(activeSample.id, "unhealthy")}
                  >
                    左边红框：不健康
                  </GameButton>
                  <GameButton
                    type="button"
                    variant="success"
                    className="px-3 py-3 text-sm font-semibold"
                    onClick={() => onLabel(activeSample.id, "healthy")}
                  >
                    右边绿框：健康
                  </GameButton>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#9ecde2]">先在第一步收集至少 10 个样本。</p>
          )}
        </GamePanel>
      </div>
    </div>
  );
}
