"use client";

import Image from "next/image";
import { useState } from "react";
import type { FarmSample, RiceLabel } from "@/lib/farm/types";

interface StepLabelProps {
  samples: FarmSample[];
  labels: Record<string, RiceLabel>;
  activeSampleId: string | null;
  onFocusSample: (sampleId: string) => void;
  onLabel: (sampleId: string, label: RiceLabel) => void;
  className?: string;
}

function labelText(label: RiceLabel) {
  return label === "healthy" ? "健康" : "不健康";
}

const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");

function sampleImageSrc(sampleId: string) {
  const path = `/images/${sampleId.toLowerCase()}.png`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${path}` : path;
}

export default function StepLabel({
  samples,
  labels,
  activeSampleId,
  onFocusSample,
  onLabel,
  className,
}: StepLabelProps) {
  const [hoveredSampleId, setHoveredSampleId] = useState<string | null>(null);
  const previewSampleId = hoveredSampleId ?? activeSampleId;
  const activeSample = samples.find((sample) => sample.id === previewSampleId) ?? samples[0] ?? null;
  const labeledCount = samples.filter((sample) => labels[sample.id] !== undefined).length;

  return (
    <div className={`h-full min-h-0 ${className ?? ""}`}>
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-2xl border border-[#cfd9eb] bg-white p-4">
          <p className="text-sm font-semibold text-[#263e67]">已收集样本</p>
          <p className="mt-1 text-xs text-[#5e6e94]">标注进度 {labeledCount}/{samples.length}</p>

          <div
            className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1"
            onPointerLeave={() => setHoveredSampleId(null)}
          >
            {samples.map((sample) => {
              const current = labels[sample.id];
              const focused = activeSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  className={`w-full rounded-xl border px-2.5 py-2 text-left text-sm ${
                    focused
                      ? "border-[#7fa8e6] bg-[#e9f1ff] text-[#214273]"
                      : "border-[#d3dcef] bg-[#f5f8ff] text-[#4a5c84]"
                  }`}
                  onPointerEnter={() => setHoveredSampleId(sample.id)}
                  onClick={() => onFocusSample(sample.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#cdd8ee] bg-[#f8faff]">
                      <Image
                        src={sampleImageSrc(sample.id)}
                        alt={`${sample.name}样本图`}
                        fill
                        sizes="40px"
                        className="object-cover"
                        quality={62}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate">{sample.name}</p>
                      <p className="text-[11px] text-[#6b7a9f]">{current ? labelText(current) : "未标注"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-2xl border border-[#d0dbee] bg-white p-4">
          {activeSample ? (
            <>
              <p className="text-sm font-semibold text-[#263f69]">第二步：人工打标签</p>
              <p className="mt-1 text-xs text-[#5e7097]">同屏查看图片和特征，直接点击下方按钮完成标注。</p>

              <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-[#d0dcee] bg-[#f3f7ff] p-3 sm:p-4">
                <p className="text-sm font-semibold text-[#263e67]">{activeSample.name}</p>

                <div className="mt-2 grid gap-3 md:grid-cols-[188px_1fr]">
                  <div className="space-y-2">
                    <div className="relative h-[168px] overflow-hidden rounded-xl border border-[#cdd8ee] bg-[#f9fbff]">
                      <Image
                        src={sampleImageSrc(activeSample.id)}
                        alt={`${activeSample.name}高清图`}
                        fill
                        sizes="(max-width: 768px) 100vw, 188px"
                        className="object-cover"
                        priority
                        quality={76}
                      />
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        labels[activeSample.id] === "healthy"
                          ? "border-[#6f9fe8] bg-[#e8f1ff] text-[#2c5ea8]"
                          : labels[activeSample.id] === "unhealthy"
                            ? "border-[#d5785d] bg-[#fff0eb] text-[#a64a31]"
                            : "border-[#ccd7ec] bg-[#eef2fb] text-[#7d88a6]"
                      }`}
                    >
                      当前标签：{labels[activeSample.id] ? labelText(labels[activeSample.id]) : "未标注"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#cdd8ee] bg-white p-3 text-[13px] leading-6 text-[#3a4e77]">
                    <p>叶子：{activeSample.profile.leaf}</p>
                    <p>稻秆：{activeSample.profile.stem}</p>
                    <p>小稻秆数量：{activeSample.profile.tiller}</p>
                    <p>虫害：{activeSample.profile.pest}</p>
                    <p>稻穗：{activeSample.profile.panicle}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[#da856d] bg-[#fff1ec] px-3 py-3 text-sm font-semibold text-[#a6472f]"
                    onClick={() => onLabel(activeSample.id, "unhealthy")}
                  >
                    标为不健康
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#78a7e8] bg-[#edf3ff] px-3 py-3 text-sm font-semibold text-[#2b4f8e]"
                    onClick={() => onLabel(activeSample.id, "healthy")}
                  >
                    标为健康
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#60749a]">先在第一步收集至少 10 个样本。</p>
          )}
        </section>
      </div>
    </div>
  );
}
