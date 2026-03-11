"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { createFarmProloguePanels, type FarmPrologueTone } from "@/lib/farm/prologue";

interface FarmPrologueProps {
  playerName: string;
  onBack: () => void;
  onSeen: () => void;
  onStartGame: () => void;
}

const STICKER_POSITIONS = [
  "right-4 top-[4.5rem] w-24 sm:right-6 sm:top-24 sm:w-32",
  "left-4 top-[4.5rem] w-20 sm:left-6 sm:top-28 sm:w-28",
  "right-10 bottom-[6.5rem] hidden w-24 sm:block sm:w-28",
] as const;

// 总动画时长 - 用于模拟视频播放
const TOTAL_VIDEO_DURATION_MS = 38000; // 约38秒

const TONE_STYLES: Record<
  FarmPrologueTone,
  {
    backdrop: string;
    panelBorder: string;
    chip: string;
    bubble: string;
    overlay: string;
    sidebar: string;
    accent: string;
    sticker: string;
  }
> = {
  gold: {
    backdrop: "bg-[radial-gradient(circle_at_18%_18%,#fff7d1_0%,#efcb6d_28%,#7b5618_100%)]",
    panelBorder: "border-[#f5d16f] shadow-[0_30px_80px_rgba(84,56,13,0.34)]",
    chip: "bg-[#fff0bc] text-[#80540c]",
    bubble: "border-[#efd07d] bg-[rgba(255,246,214,0.92)] text-[#57370a]",
    overlay: "bg-[linear-gradient(145deg,rgba(255,233,177,0.08)_0%,rgba(170,110,12,0.22)_46%,rgba(31,19,6,0.74)_100%)]",
    sidebar: "border-[#e8c86f] bg-[rgba(70,45,10,0.58)] text-[#fff4d5]",
    accent: "bg-[#ffe08c]",
    sticker: "border-[#ffe39e] bg-[rgba(255,246,216,0.9)]",
  },
  alert: {
    backdrop: "bg-[radial-gradient(circle_at_16%_16%,#fde5c7_0%,#d9854e_26%,#411911_100%)]",
    panelBorder: "border-[#f2a165] shadow-[0_30px_80px_rgba(73,28,15,0.36)]",
    chip: "bg-[#ffe0ca] text-[#86341a]",
    bubble: "border-[#f2b17f] bg-[rgba(255,237,228,0.92)] text-[#602213]",
    overlay: "bg-[linear-gradient(148deg,rgba(255,240,214,0.06)_0%,rgba(174,68,31,0.3)_48%,rgba(26,8,5,0.76)_100%)]",
    sidebar: "border-[#df8e58] bg-[rgba(80,24,18,0.62)] text-[#ffeadf]",
    accent: "bg-[#ffba7d]",
    sticker: "border-[#f3b17d] bg-[rgba(255,234,226,0.88)]",
  },
  plea: {
    backdrop: "bg-[radial-gradient(circle_at_18%_16%,#fff3dc_0%,#d7b997_28%,#4c3521_100%)]",
    panelBorder: "border-[#e7c28b] shadow-[0_30px_80px_rgba(56,37,20,0.34)]",
    chip: "bg-[#fff0d9] text-[#7a5121]",
    bubble: "border-[#e8c494] bg-[rgba(255,248,236,0.93)] text-[#5b3c18]",
    overlay: "bg-[linear-gradient(142deg,rgba(255,245,224,0.08)_0%,rgba(132,96,48,0.24)_50%,rgba(27,17,10,0.76)_100%)]",
    sidebar: "border-[#d4b082] bg-[rgba(70,48,23,0.6)] text-[#fff0dc]",
    accent: "bg-[#ffd6a0]",
    sticker: "border-[#efd3ae] bg-[rgba(255,247,236,0.9)]",
  },
  hero: {
    backdrop: "bg-[radial-gradient(circle_at_18%_16%,#fff1cd_0%,#d0b3ff_20%,#2c325f_100%)]",
    panelBorder: "border-[#d7c0ff] shadow-[0_30px_80px_rgba(29,34,75,0.38)]",
    chip: "bg-[#efe5ff] text-[#533d88]",
    bubble: "border-[#d9c4ff] bg-[rgba(248,243,255,0.93)] text-[#3b2f67]",
    overlay: "bg-[linear-gradient(145deg,rgba(255,246,223,0.08)_0%,rgba(111,85,184,0.24)_48%,rgba(8,11,32,0.78)_100%)]",
    sidebar: "border-[#b59cfc] bg-[rgba(28,34,76,0.64)] text-[#f5f0ff]",
    accent: "bg-[#d4b2ff]",
    sticker: "border-[#d9c4ff] bg-[rgba(244,238,255,0.88)]",
  },
  growth: {
    backdrop: "bg-[radial-gradient(circle_at_18%_16%,#eef7d4_0%,#8dc67d_24%,#1c4f38_100%)]",
    panelBorder: "border-[#a8dc92] shadow-[0_30px_80px_rgba(18,65,43,0.38)]",
    chip: "bg-[#edf9de] text-[#35603b]",
    bubble: "border-[#a9db95] bg-[rgba(241,252,232,0.92)] text-[#274c2e]",
    overlay: "bg-[linear-gradient(145deg,rgba(239,251,214,0.08)_0%,rgba(68,141,87,0.22)_46%,rgba(8,31,24,0.76)_100%)]",
    sidebar: "border-[#9fd188] bg-[rgba(20,62,42,0.64)] text-[#edfae0]",
    accent: "bg-[#b9ef9e]",
    sticker: "border-[#b8e59d] bg-[rgba(236,250,227,0.88)]",
  },
  cta: {
    backdrop: "bg-[radial-gradient(circle_at_18%_16%,#fff0c7_0%,#77d49c_20%,#12382c_100%)]",
    panelBorder: "border-[#8fe7b1] shadow-[0_30px_80px_rgba(12,47,35,0.42)]",
    chip: "bg-[#e8ffef] text-[#266144]",
    bubble: "border-[#8ce0ae] bg-[rgba(238,255,244,0.93)] text-[#1f4f37]",
    overlay: "bg-[linear-gradient(145deg,rgba(255,243,210,0.08)_0%,rgba(33,143,89,0.22)_46%,rgba(6,24,18,0.82)_100%)]",
    sidebar: "border-[#87daa8] bg-[rgba(12,52,36,0.7)] text-[#eefef4]",
    accent: "bg-[#9df4bc]",
    sticker: "border-[#9ae8b8] bg-[rgba(237,255,244,0.9)]",
  },
};

export default function FarmPrologue({ playerName, onBack, onSeen, onStartGame }: FarmPrologueProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showVideoMode, setShowVideoMode] = useState(true); // 新增：视频模式
  const progress = useRef(0);
  const playerLabel = playerName.trim() || "你";
  const panels = useMemo(() => createFarmProloguePanels(playerLabel), [playerLabel]);
  const panel = panels[activeIndex];
  const tone = TONE_STYLES[panel.tone];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => setReducedMotion(mediaQuery.matches);

    applyMotionPreference();
    mediaQuery.addEventListener("change", applyMotionPreference);
    return () => mediaQuery.removeEventListener("change", applyMotionPreference);
  }, []);

  // 自动连续播放 - 模拟视频效果
  useEffect(() => {
    if (!isPlaying || !showVideoMode || activeIndex >= panels.length - 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => Math.min(current + 1, panels.length - 1));
    }, panels[activeIndex].durationMs);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, showVideoMode, panels]);

  function handleNext() {
    if (activeIndex === panels.length - 1) {
      onSeen();
      onStartGame();
      return;
    }
    setActiveIndex((current) => Math.min(current + 1, panels.length - 1));
  }

  function handlePrevious() {
    setActiveIndex((current) => Math.max(current - 1, 0));
  }

  function handleSkip() {
    onSeen();
    onStartGame();
  }

  function togglePlayPause() {
    setIsPlaying((current) => !current);
  }

  return (
    <section className={`relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 ${tone.backdrop}`}>
      <div className="farm-prologue-halftone absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,248,220,0.38)_0%,rgba(255,248,220,0)_100%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.18fr)_360px] lg:items-stretch">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/30 bg-[rgba(16,12,8,0.18)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(14,8,4,0.18)] backdrop-blur-sm lg:col-span-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">Level 1 Prologue - Video Mode</p>
            <h1 className="font-display mt-1 text-2xl leading-tight sm:text-3xl">关卡1开场故事 · 小麦的稻田</h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/30 bg-white/12 px-4 text-sm text-white transition hover:bg-white/18"
              onClick={togglePlayPause}
            >
              {isPlaying ? "⏸ 暂停" : "▶ 继续"}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/35 bg-[rgba(17,13,10,0.3)] px-4 text-sm text-white transition hover:bg-[rgba(17,13,10,0.45)]"
              onClick={handleSkip}
            >
              跳过剧情
            </button>
          </div>
        </div>

        <article className={`relative overflow-hidden rounded-[34px] border-4 bg-[#140e08] ${tone.panelBorder}`}>
          <div className={`absolute inset-0 ${reducedMotion ? "" : "farm-prologue-pan"}`}>
            <Image
              src={panel.imageSrc}
              alt={panel.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 68vw"
              className="object-cover"
              style={{ objectPosition: panel.imagePosition }}
            />
          </div>
          <div className={`absolute inset-0 ${tone.overlay}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,8,0.04)_0%,rgba(20,14,8,0.14)_40%,rgba(14,9,6,0.7)_100%)]" />

          {panel.supportImages.slice(0, 3).map((src, index) => (
            <div
              key={`${panel.id}-${src}`}
              className={`absolute ${STICKER_POSITIONS[index] ?? STICKER_POSITIONS[0]} ${reducedMotion ? "" : "farm-prologue-sticker"} hidden overflow-hidden rounded-[22px] border-2 p-1 shadow-[0_16px_34px_rgba(12,8,5,0.28)] sm:block ${tone.sticker}`}
              style={{
                animationDelay: `${index * 180}ms`,
                ["--farm-sticker-rotate" as string]: `${index === 1 ? -7 : 8 - index * 5}deg`,
              }}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-white/30">
                <Image src={src} alt="" fill sizes="(max-width: 640px) 0px, 140px" className="object-cover" />
              </div>
            </div>
          ))}

          <div className="relative flex min-h-[480px] flex-col justify-between p-5 sm:min-h-[620px] sm:p-6 lg:min-h-[690px]">
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase ${tone.chip}`}>
                {panel.eyebrow}
              </span>
              <div className="rounded-full border border-white/24 bg-black/18 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
                {activeIndex + 1} / {panels.length}
              </div>
            </div>

            <div className="mt-auto max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                {panel.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-white/20 bg-black/22 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <div className={`rounded-[30px] border px-5 py-5 shadow-[0_24px_50px_rgba(14,8,5,0.24)] backdrop-blur-md sm:px-6 sm:py-6 ${tone.bubble}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-current/70">Story Beat</p>
                <h2 className="font-display mt-2 text-3xl leading-tight sm:text-[2.2rem]">{panel.title}</h2>
                <p className="mt-3 text-base leading-8 sm:text-lg">{panel.narration}</p>
                <p className="mt-3 text-sm leading-7 text-current/80 sm:text-[15px]">{panel.aside}</p>
                {panel.bubble ? (
                  <div className="mt-4 inline-flex max-w-2xl rounded-[22px] border border-current/15 bg-white/36 px-4 py-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    “{panel.bubble}”
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <aside className={`flex flex-col rounded-[30px] border p-4 shadow-[0_24px_50px_rgba(14,8,5,0.22)] backdrop-blur-md ${tone.sidebar}`}>
          <div className="rounded-[24px] border border-white/14 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-current/72">剧情进度</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className={`h-full rounded-full ${tone.accent} transition-all duration-500`}
                style={{ width: `${((activeIndex + 1) / panels.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-current/82">
              自动播放中，共 {panels.length} 幕。可随时暂停或跳过。
            </p>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {panels.map((item, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex min-h-12 items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-white/30 bg-white/14 text-white"
                      : isPast
                        ? "border-white/10 bg-white/5 text-current/60"
                        : "border-white/10 bg-black/10 text-current/78 hover:bg-white/8"
                  }`}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsPlaying(false);
                  }}
                >
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive ? "border-white/30 bg-white/20" :
                    isPast ? "border-white/10 bg-white/10 text-current/60" :
                    "border-white/16 bg-black/18"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-current/68">{item.narration}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/14 bg-black/12 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-current/70">当前内容</p>
            <div className="mt-3 rounded-2xl border border-white/12 bg-white/8 px-3 py-3 text-sm leading-7 text-current/86">
              <p>{panel.aside}</p>
              <p className="mt-2 text-current/72">主角老师：{playerLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-current transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={handlePrevious}
              disabled={activeIndex === 0}
            >
              ⏮ 上一幕
            </button>
            <button
              type="button"
              className="min-h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#ffe189_0%,#ffb341_100%)] px-5 text-sm font-semibold text-[#392309] shadow-[0_14px_28px_rgba(255,187,84,0.28)] transition hover:brightness-[1.03]"
              onClick={handleNext}
            >
              {activeIndex === panels.length - 1 ? "开始教小麦！" : "下一幕 →"}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/20 bg-black/10 px-4 text-sm font-medium text-current transition hover:bg-white/10"
              onClick={onBack}
            >
              返回
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
