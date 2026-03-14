"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMobile } from "@/components/hooks/useMobile";
import type { FarmSample, RiceLabel } from "@/lib/farm/types";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";

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

const SAMPLE_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

function parseSampleIndex(sampleId: string) {
  const match = sampleId.match(/(\d+)/);
  if (!match) {
    return 1;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const CLOUD_BASE_URL = "https://bear-public.tos-cn-shanghai.volces.com";

function sampleImageCandidates(sampleId: string) {
  const sampleIndex = parseSampleIndex(sampleId);
  return SAMPLE_IMAGE_EXTENSIONS.flatMap((ext) => [
    `${CLOUD_BASE_URL}/image${sampleIndex}${ext}`,
    `${CLOUD_BASE_URL}/images_a${sampleIndex}${ext}`,
  ]);
}

function LocalSampleImage({
  sampleId,
  alt,
  sizes,
  quality,
  priority = false,
}: {
  sampleId: string;
  alt: string;
  sizes: string;
  quality: number;
  priority?: boolean;
}) {
  const candidates = useMemo(() => sampleImageCandidates(sampleId), [sampleId]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const src = candidates[Math.min(candidateIndex, candidates.length - 1)] ?? `${CLOUD_BASE_URL}/image1.png`;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
      quality={quality}
      priority={priority}
      onError={() => setCandidateIndex((current) => (current < candidates.length - 1 ? current + 1 : current))}
    />
  );
}

export default function StepLabel({
  samples,
  labels,
  activeSampleId,
  onFocusSample,
  onLabel,
  className,
}: StepLabelProps) {
  const { isMobile } = useMobile();
  const activeSample = samples.find((sample) => sample.id === activeSampleId) ?? samples[0] ?? null;
  const activeIndex = samples.findIndex((sample) => sample.id === activeSampleId);
  const labeledCount = samples.filter((sample) => labels[sample.id] !== undefined).length;

  // 移动端紧凑布局 - 所有内容在一屏内
  if (isMobile) {
    return (
      <div className={`flex flex-col ${className ?? ""}`}>
        {/* 顶部进度条 - 紧凑 */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#263e67]">
            进度 {labeledCount}/{samples.length}
          </span>
          <span className="text-[10px] text-[#6b7a9f]">
            {activeIndex + 1} / {samples.length}
          </span>
        </div>

        {/* 主卡片 - 左图右信息 */}
        {activeSample && (
          <div className="flex gap-2 rounded-xl border border-[#cdd8ee] bg-[#f3f7ff] p-2">
            {/* 左侧：稻子图片 - 缩小 */}
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#cdd8ee] bg-[#f9fbff]">
              <LocalSampleImage
                key={activeSample.id}
                sampleId={activeSample.id}
                alt={`${activeSample.name}高清图`}
                sizes="112px"
                priority
                quality={76}
              />
            </div>

            {/* 右侧：特征信息 + 按钮 */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              {/* 顶部：名称和状态 */}
              <div>
                <p className="text-xs font-semibold text-[#263e67] truncate">{activeSample.name}</p>
                <div
                  className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                    labels[activeSample.id] === "healthy"
                      ? "border-[#6f9fe8] bg-[#e8f1ff] text-[#2c5ea8]"
                      : labels[activeSample.id] === "unhealthy"
                        ? "border-[#d5785d] bg-[#fff0eb] text-[#a64a31]"
                        : "border-[#ccd7ec] bg-[#eef2fb] text-[#7d88a6]"
                  }`}
                >
                  {labels[activeSample.id] ? labelText(labels[activeSample.id]) : "未选择"}
                </div>
              </div>

              {/* 中部：特征 - 紧凑网格 */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] leading-4 text-[#4a5c84]">
                <span>叶子：</span>
                <span className="truncate">{activeSample.profile.leaf}</span>
                <span>稻秆：</span>
                <span className="truncate">{activeSample.profile.stem}</span>
                <span>小稻秆：</span>
                <span className="truncate">{activeSample.profile.tiller}</span>
                <span>虫害：</span>
                <span className="truncate">{activeSample.profile.pest}</span>
              </div>

              {/* 底部：按钮 */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  className={`rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    labels[activeSample.id] === "unhealthy"
                      ? "border-[#d5785d] bg-[#fff0eb] text-[#a64a31]"
                      : "border-[#da856d] bg-white text-[#a6472f]"
                  }`}
                  onClick={() => onLabel(activeSample.id, "unhealthy")}
                >
                  不健康
                </button>
                <button
                  type="button"
                  className={`rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    labels[activeSample.id] === "healthy"
                      ? "border-[#6f9fe8] bg-[#edf3ff] text-[#2b4f8e]"
                      : "border-[#78a7e8] bg-white text-[#2b4f8e]"
                  }`}
                  onClick={() => onLabel(activeSample.id, "healthy")}
                >
                  健康
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 导航点 */}
        <div className="mt-2 flex justify-center gap-1">
          {samples.map((sample, index) => (
            <button
              key={sample.id}
              type="button"
              className={`h-1 rounded-full transition-all ${
                sample.id === activeSampleId
                  ? "w-4 bg-[#6ba8ff]"
                  : labels[sample.id]
                    ? "w-1 bg-[#d5785d]"
                    : "w-1 bg-[#ccd7ec]"
              }`}
              onClick={() => onFocusSample(sample.id)}
            />
          ))}
        </div>

        {/* 稻穗特征单独显示 - 如果需要完整信息 */}
        {activeSample && (
          <div className="mt-2 rounded-lg border border-[#cdd8ee] bg-white px-2 py-1.5">
            <p className="text-[10px] leading-4 text-[#4a5c84]">
              <span className="font-semibold">稻穗：</span>{activeSample.profile.panicle}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 桌面端布局（保持原样）
  return (
    <div className={`h-full min-h-0 ${className ?? ""}`}>
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-2xl border border-[#cfd9eb] bg-white p-4">
          <p className="text-sm font-semibold text-[#263e67]">教材篮</p>
          <p className="mt-1 text-xs text-[#5e6e94]">{FARM_METAPHOR_LABELS.answerSticker}进度 {labeledCount}/{samples.length}</p>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
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
                  onClick={() => onFocusSample(sample.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#cdd8ee] bg-[#f8faff]">
                      <LocalSampleImage
                        key={sample.id}
                        sampleId={sample.id}
                        alt={`${sample.name}样本图`}
                        sizes="40px"
                        quality={62}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate">{sample.name}</p>
                      <p className="text-[11px] text-[#6b7a9f]">{current ? labelText(current) : "还没贴贴纸"}</p>
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
              <p className="text-sm font-semibold text-[#263f69]">第二步：给练习题贴答案贴纸</p>
              <p className="mt-1 text-xs text-[#5e7097]">同屏查看图片和特征，再给这株稻子选一张答案贴纸。</p>

              <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-[#d0dcee] bg-[#f3f7ff] p-3 sm:p-4">
                <p className="text-sm font-semibold text-[#263e67]">{activeSample.name}</p>

                <div className="mt-2 grid gap-3 md:grid-cols-[188px_1fr]">
                  <div className="space-y-2">
                    <div className="relative h-[168px] overflow-hidden rounded-xl border border-[#cdd8ee] bg-[#f9fbff]">
                      <LocalSampleImage
                        key={activeSample.id}
                        sampleId={activeSample.id}
                        alt={`${activeSample.name}高清图`}
                        sizes="(max-width: 768px) 100vw, 188px"
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
                      当前答案贴纸：{labels[activeSample.id] ? labelText(labels[activeSample.id]) : "还没贴贴纸"}
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
                    贴上不健康贴纸
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#78a7e8] bg-[#edf3ff] px-3 py-3 text-sm font-semibold text-[#2b4f8e]"
                    onClick={() => onLabel(activeSample.id, "healthy")}
                  >
                    贴上健康贴纸
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#60749a]">先在第一步挑到至少 10 株教材。</p>
          )}
        </section>
      </div>
    </div>
  );
}
