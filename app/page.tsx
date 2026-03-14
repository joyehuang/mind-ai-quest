"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import FarmKnowledgeReveal from "@/components/farm/FarmKnowledgeReveal";
import FarmQuest from "@/components/farm/FarmQuest";
import WenshugeQuest from "@/components/wenshuge/WenshugeQuest";
import {
  FARM_CERTIFICATE_STORAGE_KEY,
  FARM_KNOWLEDGE_STORAGE_KEY,
  type FarmCertificateSnapshot,
} from "@/lib/farm/terminology";
import { preloadWheatModel } from "@/lib/farm/wheat-model";

type Scene =
  | "landing"
  | "video"
  | "select"
  | "farm"
  | "farm-reveal"
  | "brief-wenshuge"
  | "wenshuge";

const STYLE_OPTIONS = ["侦查员", "工程师", "探险家"];
const AI_ASSISTANT_TITLE = "AI小助手";
const STYLE_HINTS: Record<(typeof STYLE_OPTIONS)[number], string> = {
  侦查员: "擅长发现线索，定位异常变化",
  工程师: "擅长给小麦试技能，让判断越来越稳",
  探险家: "擅长尝试新思路，突破旧规则",
};
const FARM_KNOWLEDGE_EVENT = "farm-knowledge-state-change";
const LANDING_TO_VIDEO_DELAY_MS = 820;

function readFarmKnowledgeSeen() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(FARM_KNOWLEDGE_STORAGE_KEY) === "true";
}

function subscribeFarmKnowledgeSeen(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(FARM_KNOWLEDGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(FARM_KNOWLEDGE_EVENT, handleChange);
  };
}

function readFarmCertificate() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(FARM_CERTIFICATE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FarmCertificateSnapshot;
  } catch {
    return null;
  }
}

function getVideoMimeType(src: string) {
  if (src.endsWith(".webm")) {
    return "video/webm";
  }
  if (src.endsWith(".mov")) {
    return "video/quicktime";
  }
  return "video/mp4";
}

function normalizeTeacherBase(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/老师$/u, "");
}

export default function Home() {
  const [scene, setScene] = useState<Scene>("landing");
  const [name, setName] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [completedFarm, setCompletedFarm] = useState(false);
  const [completedWenshuge, setCompletedWenshuge] = useState(false);
  const [isTeacherPromptOpen, setIsTeacherPromptOpen] = useState(false);
  const [isLogoExiting, setIsLogoExiting] = useState(false);
  const [farmEntryOrigin, setFarmEntryOrigin] = useState<"landing" | "select">("landing");
  const onboardingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasSeenFarmKnowledge = useSyncExternalStore(subscribeFarmKnowledgeSeen, readFarmKnowledgeSeen, () => false);
  const completedCount = Number(completedFarm) + Number(completedWenshuge);
  const progressPercent = (completedCount / 2) * 100;
  const teacherBaseName = normalizeTeacherBase(name);
  const teacherName = teacherBaseName ? `${teacherBaseName}老师` : "";
  const homeVideoSources = ["/homepage.mp4"];

  useEffect(() => {
    return () => {
      if (onboardingTimeoutRef.current) {
        clearTimeout(onboardingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const preloadFarmAssets = () => {
      void import("@/components/farm/FarmQuestScene3D");
      preloadWheatModel();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadFarmAssets, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadFarmAssets, 180);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (scene !== "video") {
      return;
    }

    const video = onboardingVideoRef.current;
    if (!video) {
      return;
    }

    const playPromise = video.play();
    playPromise?.catch(() => {});
  }, [scene]);

  function markFarmKnowledgeSeen() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FARM_KNOWLEDGE_STORAGE_KEY, "true");
      window.dispatchEvent(new Event(FARM_KNOWLEDGE_EVENT));
    }
  }

  function saveFarmCertificate(snapshot: FarmCertificateSnapshot) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FARM_CERTIFICATE_STORAGE_KEY, JSON.stringify(snapshot));
    }
  }

  function clearOnboardingTimeout() {
    if (onboardingTimeoutRef.current) {
      clearTimeout(onboardingTimeoutRef.current);
      onboardingTimeoutRef.current = null;
    }
  }

  function handleStartOnboarding() {
    clearOnboardingTimeout();
    setIsTeacherPromptOpen(false);
    setIsLogoExiting(true);
    onboardingTimeoutRef.current = setTimeout(() => {
      setScene("video");
    }, LANDING_TO_VIDEO_DELAY_MS);
  }

  function handleFinishOnboarding() {
    clearOnboardingTimeout();
    onboardingVideoRef.current?.pause();
    setIsTeacherPromptOpen(true);
  }

  function handleConfirmTeacherName() {
    if (!teacherBaseName) {
      return;
    }

    setIsTeacherPromptOpen(false);
    setFarmEntryOrigin("select");
    setScene("farm");
  }

  function handleReturnToLanding() {
    clearOnboardingTimeout();
    setIsLogoExiting(false);
    setIsTeacherPromptOpen(false);
    setScene("landing");
  }

  function handleEnterFarm(origin: "landing" | "select" = "select") {
    setFarmEntryOrigin(origin);
    setScene("farm");
  }

  function handleEnterFarmKnowledge(origin: "landing" | "select") {
    setFarmEntryOrigin(origin);
    setScene("farm-reveal");
  }

  if (scene === "brief-wenshuge") {
    return (
      <div className="min-h-screen w-screen bg-[radial-gradient(circle_at_18%_18%,#f2f4f9_0%,#dee5f4_45%,#b8c8e4_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
          <header className="rounded-3xl border border-[#9eb3d4] bg-[rgba(248,251,255,0.92)] p-5 shadow-[0_16px_36px_rgba(36,62,104,0.14)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#4c6288]">Story Briefing</p>
            <h1 className="font-display mt-2 text-3xl text-[#21385d]">主题关卡2：文枢阁的健康日记</h1>
            <p className="mt-2 text-sm text-[#3f5682]">
              进入任务前，先听 {AI_ASSISTANT_TITLE} 给你的背景概述。
            </p>
          </header>

          <article className="rounded-3xl border border-[#9eb3d4] bg-[rgba(247,251,255,0.94)] p-5 shadow-[0_14px_30px_rgba(34,58,99,0.12)]">
            <p className="text-sm font-semibold text-[#27406b]">
              {AI_ASSISTANT_TITLE} {teacherName || "小老师"}：
            </p>
            <p className="mt-2 text-sm leading-7 text-[#35507f]">
              文枢阁保护团队每天都会记录结构与环境数据，但这些数据没有人工标签，系统必须先学会“什么是正常模式”。这次我们要先筛掉无关特征、完成预处理，再通过无监督学习给每一天打异常分数，并通过阈值调优在误检与漏检之间找到平衡。
            </p>
            <p className="mt-2 text-sm leading-7 text-[#35507f]">
              最后你要像专家一样复核模型结果，把错判修正，确保关键异常不被遗漏。
            </p>
          </article>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-[#9eb2d2] bg-[rgba(255,255,255,0.82)] px-4 py-2 text-sm text-[#36527f]"
              onClick={() => setScene("select")}
            >
              返回关卡选择
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#2f5f9a] px-5 py-2 text-sm font-semibold text-white"
              onClick={() => setScene("wenshuge")}
            >
              我明白了，开始关卡2
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (scene === "farm-reveal") {
    return (
      <FarmKnowledgeReveal
        playerName={teacherName}
        certificate={readFarmCertificate()}
        returnLabel={farmEntryOrigin === "landing" ? "返回首页" : "返回游戏主页"}
        onSeen={markFarmKnowledgeSeen}
        onBack={() => setScene(farmEntryOrigin)}
      />
    );
  }

  if (scene === "farm") {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#08160d]">
        <FarmQuest
          playerName={teacherName || "小老师"}
          playerStyle={style}
          onBack={() => setScene(farmEntryOrigin)}
          onComplete={(summary) => {
            setCompletedFarm(true);
            saveFarmCertificate({
              playerName: teacherName || "小老师",
              levelName: "关卡1：保护我们的稻田",
              answerRate: summary.answerRate,
              completedAt: summary.completedAt,
            });
            setScene("farm-reveal");
          }}
        />
      </div>
    );
  }

  if (scene === "wenshuge") {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#07131f]">
        <WenshugeQuest
          playerName={teacherName || "小老师"}
          playerStyle={style}
          onBack={() => setScene("select")}
          onComplete={() => {
            setCompletedWenshuge(true);
            setScene("select");
          }}
        />
      </div>
    );
  }

  if (scene === "video") {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <video
          ref={onboardingVideoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          playsInline
          volume={1}
          preload="auto"
          onEnded={handleFinishOnboarding}
        >
          <source src="https://bear-public.tos-cn-shanghai.volces.com/onboard-video.mp4" type="video/mp4" />
        </video>

        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-white/18 bg-black/28 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/40"
          onClick={handleFinishOnboarding}
        >
          跳过视频
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <p className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs tracking-[0.18em] text-white/86 backdrop-blur-md">
            跟着小麦认识这次的任务
          </p>
        </div>

        {isTeacherPromptOpen ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(32,16,6,0.42)] px-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[28px] border border-[#f6ddb2] bg-[linear-gradient(180deg,rgba(255,249,237,0.98)_0%,rgba(255,241,212,0.96)_100%)] p-6 text-[#573111] shadow-[0_26px_70px_rgba(58,25,5,0.24)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9c6630]">Name Card</p>
                  <h2 className="font-display mt-2 text-3xl text-[#5b340f]">给自己起个名字</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#e7c88c] px-3 py-1 text-sm text-[#8a5c29] transition hover:bg-white/55"
                  onClick={handleReturnToLanding}
                >
                  关闭
                </button>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#7a4a19]">
                你就是小麦的老师。确认后，AI 小当家和小麦都会用 <span className="font-semibold text-[#5f3206]">XXX老师</span> 来称呼你。
              </p>

              <label className="mt-5 block text-sm font-semibold text-[#7a4a19]">
                你的名字
                <div className="mt-2 flex items-center overflow-hidden rounded-2xl border-2 border-[#e9cb91] bg-white/82 shadow-inner">
                  <input
                    autoFocus
                    className="h-13 min-w-0 flex-1 bg-transparent px-4 text-base text-[#3f260e] outline-none placeholder:text-[#b18659]"
                    value={teacherBaseName}
                    onChange={(event) => setName(normalizeTeacherBase(event.target.value))}
                    maxLength={12}
                    placeholder="例如：小麦、阿谷、云朵"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleConfirmTeacherName();
                      }
                    }}
                  />
                  <span className="mr-2 rounded-full border border-[#e7c88c] bg-[#fff4df] px-4 py-2 text-sm font-semibold text-[#8a5c29]">
                    老师
                  </span>
                </div>
              </label>

              <button
                type="button"
                className="mt-5 min-h-13 w-full rounded-2xl bg-[linear-gradient(135deg,#ffcb69_0%,#ea8c27_100%)] px-5 text-base font-bold text-[#432208] shadow-[0_16px_30px_rgba(110,55,12,0.28)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#d4c0a0] disabled:text-[#7c6751]"
                disabled={!teacherBaseName}
                onClick={handleConfirmTeacherName}
              >
                确认成为{teacherName || "XXX老师"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (scene === "landing") {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Image
          src="/bg-img-v2.webp"
          alt="AI小当家开场背景"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,246,225,0.12)_0%,rgba(60,33,12,0.08)_44%,rgba(29,15,8,0.2)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,245,222,0.58)_0%,rgba(255,245,222,0)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(26,11,2,0)_0%,rgba(26,11,2,0.12)_30%,rgba(26,11,2,0.48)_100%)]" />

        <div className="absolute left-1/2 top-[24%] z-10 w-[58%] max-w-[272px] -translate-x-1/2">
          <div
            className={
              isLogoExiting
                ? "animate-[landing-logo-exit_0.82s_cubic-bezier(0.7,0,0.9,0.4)_both]"
                : "animate-[landing-logo-drop_1.45s_cubic-bezier(0.22,0.95,0.28,1.08)_both]"
            }
          >
            <Image
              src="https://bear-public.tos-cn-shanghai.volces.com/logo.png"
              alt="AI小当家"
              width={860}
              height={360}
              priority
              className="h-auto w-full drop-shadow-[0_22px_26px_rgba(86,46,15,0.3)]"
            />
          </div>
        </div>

        <div
          className={`absolute inset-x-6 top-[56%] z-10 flex flex-col items-center text-center transition-all duration-300 sm:inset-x-8 ${
            isLogoExiting
              ? "translate-y-5 opacity-0"
              : "animate-[landing-cta-rise_0.9s_ease_0.48s_both]"
          }`}
        >
          <button
            type="button"
            className="mt-5 min-h-14 min-w-[11.5rem] rounded-full border border-[#ffefc8] bg-[linear-gradient(135deg,#ffe39d_0%,#ffb94a_100%)] px-8 text-lg font-bold text-[#4d2809] shadow-[0_18px_36px_rgba(108,55,15,0.28)] transition hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleStartOnboarding}
          >
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070f1b]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        {homeVideoSources.map((src) => (
          <source key={src} src={src} type={getVideoMimeType(src)} />
        ))}
      </video>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,219,146,0.24)_0%,rgba(11,16,25,0.26)_56%,rgba(7,10,18,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(8,9,12,0.04)_0%,rgba(8,9,12,0.18)_46%,rgba(8,9,12,0.34)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_34%,rgba(245,223,180,0.2)_0%,rgba(245,223,180,0)_60%)]" />

      <div className="pointer-events-auto absolute right-4 top-4 w-[min(90vw,340px)] rounded-3xl border border-[rgba(255,255,255,0.14)] bg-[rgba(14,13,11,0.5)] p-4 text-[#f7efe2] backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.22em] text-[#d6c2a1]">Game Home</p>
        <p className="mt-1 text-lg font-semibold text-[#faf2e6]">
          {teacherName || "小老师"} <span className="text-sm font-medium text-[#d9c8af]">· {style}</span>
        </p>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-[#d4c0a0]">
            <span>冒险进度</span>
            <span>{completedCount} / 2</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[rgba(255,245,228,0.18)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#d7ab63_0%,#9d8eb4_100%)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-[#dcc9ab]">冒险风格</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {STYLE_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-xl border px-2 py-2 text-xs transition ${
                style === item
                  ? "border-[rgba(255,255,255,0.16)] bg-[#f6ebd7] text-[#4a3422]"
                  : "border-[rgba(255,255,255,0.14)] bg-[rgba(25,22,18,0.5)] text-[#ebdeca]"
              }`}
              onClick={() => setStyle(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#ccb99d]">{STYLE_HINTS[style]}</p>
        <p className="mt-1 text-[11px] text-[#bda88a]">提示：三个风格只影响称号，不影响难度。</p>

        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-[rgba(255,255,255,0.16)] bg-[rgba(246,238,227,0.94)] px-3 py-2.5 text-sm font-semibold text-[#4a3721]"
          onClick={handleReturnToLanding}
        >
          重新播放开场
        </button>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 w-[min(46vw,360px)] rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(33,26,16,0.58)] p-4 text-left text-[#f5ebd8] backdrop-blur-md shadow-[0_14px_24px_rgba(52,39,22,0.4)]">
        <p className="text-xs text-[#e0cda8]">基础任务</p>
        <p className="mt-1 font-display text-2xl">关卡1：保护稻田</p>
        <p className="mt-1 text-xs text-[#e9dcc3]">
          {completedFarm ? "已完成，可再次挑战" : "直接进入任务，帮助小麦一起保护稻田"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-[rgba(255,243,218,0.96)] px-4 py-2 text-sm font-semibold text-[#4a3422]"
            onClick={() => handleEnterFarm("select")}
          >
            {completedFarm ? "再次挑战" : "开始任务"}
          </button>
          {hasSeenFarmKnowledge ? (
            <button
              type="button"
              className="min-h-11 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(246,237,214,0.16)] px-4 py-2 text-sm font-semibold text-[#f7ebd3]"
              onClick={() => handleEnterFarmKnowledge("select")}
            >
              重看知识彩蛋
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="pointer-events-auto absolute bottom-4 right-4 w-[min(46vw,360px)] rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(20,23,31,0.52)] p-4 text-left text-[#f0f3f8] backdrop-blur-md shadow-[0_14px_24px_rgba(23,28,38,0.42)]"
        onClick={() => setScene("brief-wenshuge")}
      >
        <p className="text-xs text-[#c5ccd9]">进阶任务</p>
        <p className="mt-1 font-display text-2xl">关卡2：守护文枢阁</p>
        <p className="mt-1 text-xs text-[#dde3ee]">{completedWenshuge ? "已完成，可再次挑战" : "挑战更高难度的异常识别"}</p>
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
        <p className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(14,13,11,0.42)] px-4 py-1.5 text-xs text-[#e0d1b9] backdrop-blur">
          选择一个角落任务开始冒险
        </p>
      </div>
    </div>
  );
}
