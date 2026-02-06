"use client";

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
        <aside className="rounded-2xl border border-[#d5e3db] bg-white p-4">
          <p className="text-sm font-semibold text-[#294a3a]">已收集样本</p>
          <p className="mt-1 text-xs text-[#587166]">标注进度 {labeledCount}/{samples.length}</p>

          <div className="mt-3 space-y-2">
            {samples.map((sample) => {
              const current = labels[sample.id];
              const focused = activeSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    focused
                      ? "border-[#79b694] bg-[#ebf9f1] text-[#1f6040]"
                      : "border-[#d5e3db] bg-[#f9fcfa] text-[#3f5e4f]"
                  }`}
                  onClick={() => onFocusSample(sample.id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{sample.name}</span>
                    <span className="text-xs text-[#5f776a]">{current ? labelText(current) : "?"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-[#d5e4dc] bg-white p-4">
          {activeSample ? (
            <>
              <p className="text-sm font-semibold text-[#274839]">第二步：人工打标签</p>
              <p className="mt-1 text-xs text-[#5d7569]">根据特征判断健康状态，再给样本贴标签。</p>

              <div className="mt-4 rounded-2xl border border-[#d7e6de] bg-[#f7fbf9] p-5">
                <p className="text-sm font-semibold text-[#294a3b]">{activeSample.name}</p>
                <div className="mt-3 flex items-center justify-center">
                  <div
                    className={`relative flex h-36 w-36 items-center justify-center rounded-full border-2 text-3xl font-bold ${
                      labels[activeSample.id] === "healthy"
                        ? "border-[#3aaf70] bg-[#e6f9ef] text-[#22814f]"
                        : labels[activeSample.id] === "unhealthy"
                          ? "border-[#d5785d] bg-[#fff0eb] text-[#a64a31]"
                          : "border-[#cfded6] bg-[#edf2ef] text-[#7f9388]"
                    }`}
                  >
                    {labels[activeSample.id] ? (labels[activeSample.id] === "healthy" ? "健" : "病") : "?"}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#d2e2d9] bg-white p-3 text-sm text-[#36584a]">
                  <p>叶子：{activeSample.profile.leaf}</p>
                  <p>稻秆：{activeSample.profile.stem}</p>
                  <p>小稻秆数量：{activeSample.profile.tiller}</p>
                  <p>虫害：{activeSample.profile.pest}</p>
                  <p>稻穗：{activeSample.profile.panicle}</p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[#da856d] bg-[#fff1ec] px-3 py-3 text-sm font-semibold text-[#a6472f]"
                    onClick={() => onLabel(activeSample.id, "unhealthy")}
                  >
                    左边红框：不健康
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#65b487] bg-[#e8f9ef] px-3 py-3 text-sm font-semibold text-[#1d7248]"
                    onClick={() => onLabel(activeSample.id, "healthy")}
                  >
                    右边绿框：健康
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5f766a]">先在第一步收集至少 10 个样本。</p>
          )}
        </section>
      </div>
    </div>
  );
}
