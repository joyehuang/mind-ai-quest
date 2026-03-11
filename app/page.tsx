"use client";

import { useState, useSyncExternalStore } from "react";
import AssistantNarrator from "@/components/AssistantNarrator";
import FarmKnowledgeReveal from "@/components/farm/FarmKnowledgeReveal";
import FarmPrologue from "@/components/farm/FarmPrologue";
import FarmQuest from "@/components/farm/FarmQuest";
import WenshugeQuest from "@/components/wenshuge/WenshugeQuest";
import { FARM_PROLOGUE_STORAGE_KEY } from "@/lib/farm/prologue";
import {
  FARM_CERTIFICATE_STORAGE_KEY,
  FARM_KNOWLEDGE_STORAGE_KEY,
  type FarmCertificateSnapshot,
} from "@/lib/farm/terminology";

type Scene =
  | "landing"
  | "intro"
  | "select"
  | "brief-farm"
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
const FARM_PROLOGUE_EVENT = "farm-prologue-state-change";
const FARM_KNOWLEDGE_EVENT = "farm-knowledge-state-change";

function readFarmPrologueSeen() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(FARM_PROLOGUE_STORAGE_KEY) === "true";
}

function subscribeFarmPrologueSeen(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(FARM_PROLOGUE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(FARM_PROLOGUE_EVENT, handleChange);
  };
}

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

export default function Home() {
  const [scene, setScene] = useState<Scene>("landing");
  const [name, setName] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [completedFarm, setCompletedFarm] = useState(false);
  const [completedWenshuge, setCompletedWenshuge] = useState(false);
  const [farmEntryOrigin, setFarmEntryOrigin] = useState<"landing" | "select">("landing");
  const hasSeenFarmPrologue = useSyncExternalStore(subscribeFarmPrologueSeen, readFarmPrologueSeen, () => false);
  const hasSeenFarmKnowledge = useSyncExternalStore(subscribeFarmKnowledgeSeen, readFarmKnowledgeSeen, () => false);
  const completedCount = Number(completedFarm) + Number(completedWenshuge);
  const progressPercent = (completedCount / 2) * 100;
  const trimmedName = name.trim();

  const homeVideoSources = ["/homepage.mp4"];

  const homeGuideMessage = trimmedName
    ? `太好了，${trimmedName}！你现在是“${style}”。三个风格难度一样，选喜欢的就好。准备好就点右下角进入游戏。`
    : "欢迎来到 AI小当家！先输入你的名字，再选一个喜欢的角色风格，最后点右下角进入游戏。";

  function currentFarmPrologueSeenState() {
    return readFarmPrologueSeen();
  }

  function markFarmPrologueSeen() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FARM_PROLOGUE_STORAGE_KEY, "true");
      window.dispatchEvent(new Event(FARM_PROLOGUE_EVENT));
    }
  }

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

  function handleEnterFarm(options?: { origin?: "landing" | "select"; forcePrologue?: boolean }) {
    const origin = options?.origin ?? "landing";
    const shouldForcePrologue = options?.forcePrologue ?? false;
    const seen = currentFarmPrologueSeenState();

    setFarmEntryOrigin(origin);
    setScene(!shouldForcePrologue && seen ? "farm" : "brief-farm");
  }

  function handleEnterFarmKnowledge(origin: "landing" | "select") {
    setFarmEntryOrigin(origin);
    setScene("farm-reveal");
  }

  if (scene === "brief-farm") {
    return (
      <FarmPrologue
        playerName={trimmedName}
        onBack={() => setScene(farmEntryOrigin)}
        onSeen={markFarmPrologueSeen}
        onStartGame={() => setScene("farm")}
      />
    );
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
              {AI_ASSISTANT_TITLE} {name}：
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
        playerName={trimmedName}
        certificate={readFarmCertificate()}
        returnLabel={farmEntryOrigin === "landing" ? "返回首页" : "返回关卡选择"}
        onSeen={markFarmKnowledgeSeen}
        onBack={() => setScene(farmEntryOrigin)}
      />
    );
  }

  if (scene === "farm") {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#08160d]">
        <FarmQuest
          playerName={name}
          playerStyle={style}
          onBack={() => setScene(farmEntryOrigin)}
          onComplete={(summary) => {
            setCompletedFarm(true);
            saveFarmCertificate({
              playerName: name.trim() || "小老师",
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
          playerName={name}
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

      {scene === "landing" && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
            <div className="pointer-events-auto w-full max-w-2xl rounded-[32px] border border-[rgba(255,237,201,0.9)] bg-[linear-gradient(145deg,rgba(255,253,246,0.95)_0%,rgba(253,238,205,0.92)_100%)] p-6 text-center text-[#4d3416] shadow-[0_18px_40px_rgba(38,26,12,0.24)] backdrop-blur-md sm:p-8">
              <div className="flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="rounded-full border border-[#e8c98b] bg-[#fff5df] px-3 py-1 text-[#865a23]">中小学生友好</span>
                <span className="rounded-full border border-[#e8c98b] bg-[#fff5df] px-3 py-1 text-[#865a23]">3-5 分钟一局</span>
                <span className="rounded-full border border-[#e8c98b] bg-[#fff5df] px-3 py-1 text-[#865a23]">边玩边学聪明办法</span>
              </div>
              <h2 className="font-display mt-4 text-4xl leading-tight text-[#5b3e16] sm:text-5xl">
                一起成为 AI 小当家
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#704d23] sm:text-base">
                给自己起个名字，马上进入关卡1，和小麦一起保护稻田。
              </p>
              <label className="mx-auto mt-5 block max-w-xl text-left text-sm font-semibold text-[#7a5525]">
                你的名字
                <input
                  className="mt-2 h-12 w-full rounded-2xl border-2 border-[#e6c98f] bg-[#fffaf0] px-4 text-base text-[#3b2d1d] shadow-inner outline-none transition focus:border-[#ca8f3c]"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={12}
                  placeholder="例如：小麦、阿谷、云朵"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#87602e]">
                <span className="rounded-full bg-[#f8e3bb] px-3 py-1">当前开放：关卡1</span>
                <span className="rounded-full bg-[#f2e8d6] px-3 py-1 text-[#8d7a5a]">关卡2 敬请期待</span>
              </div>
              <button
                type="button"
                className="mt-5 h-14 rounded-2xl bg-[linear-gradient(135deg,#f4c873_0%,#d48b2f_100%)] px-12 text-base font-semibold text-[#2f1f0f] shadow-[0_14px_30px_rgba(93,63,28,0.36)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#cab79e] disabled:text-[#7a6548]"
                disabled={!trimmedName}
                onClick={() => handleEnterFarm({ origin: "landing" })}
              >
                {hasSeenFarmPrologue ? "直接进入关卡1" : "开始闯关"}
              </button>
              {hasSeenFarmPrologue ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-[#7f5625] underline decoration-[#b37c39]/55 underline-offset-4 transition hover:text-[#5f3d12]"
                  onClick={() => handleEnterFarm({ origin: "landing", forcePrologue: true })}
                >
                  重看小麦的开场序幕
                </button>
              ) : null}
              {hasSeenFarmKnowledge ? (
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-[#7f5625] underline decoration-[#b37c39]/55 underline-offset-4 transition hover:text-[#5f3d12]"
                  onClick={() => handleEnterFarmKnowledge("landing")}
                >
                  重看关卡1知识彩蛋
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}

      {scene === "intro" && (
        <>
          <div className="pointer-events-auto absolute right-4 top-4 w-[min(88vw,340px)] rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(14,13,11,0.46)] p-4 text-[#f7efe2] backdrop-blur-md">
            <p className="text-xs font-semibold text-[#dcc9ab]">创建你的 AI 小助手</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,240,214,0.12)] px-2 py-0.5 text-[#e3d2b8]">
                1. 填名字
              </span>
              <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,240,214,0.12)] px-2 py-0.5 text-[#e3d2b8]">
                2. 选风格
              </span>
              <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,240,214,0.12)] px-2 py-0.5 text-[#e3d2b8]">
                3. 进游戏
              </span>
            </div>

            <label className="mt-3 block text-xs text-[#dcc9ab]">
              小助手昵称
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(246,239,228,0.95)] px-3 text-sm text-[#3b2d1d]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={12}
                placeholder="例如：小麦、阿谷、云朵"
              />
            </label>

            <p className="mt-3 text-xs text-[#dcc9ab]">角色风格</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
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
          </div>

          <AssistantNarrator
            name={trimmedName || "小麦"}
            style={style}
            message={homeGuideMessage}
            theme="farm"
            className="pointer-events-auto absolute left-4 top-4 w-[min(92vw,580px)]"
          />

          <button
            type="button"
            className="pointer-events-auto absolute bottom-4 right-4 h-12 rounded-2xl bg-[linear-gradient(135deg,#e2b56c_0%,#bb7f2f_100%)] px-6 text-sm font-semibold text-[#2f1f0f] shadow-[0_14px_26px_rgba(99,68,32,0.46)] disabled:cursor-not-allowed disabled:bg-[#a69882] disabled:text-[#564638]"
            disabled={!trimmedName}
            onClick={() => setScene("select")}
          >
            进入游戏
          </button>
        </>
      )}

      {scene === "select" && (
        <>
          <div className="pointer-events-auto absolute right-4 top-4 w-[min(88vw,320px)] rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(14,13,11,0.46)] p-4 text-[#f7efe2] backdrop-blur-md">
            <p className="text-xs text-[#d6c2a1]">当前小队</p>
            <p className="mt-1 text-sm font-semibold text-[#faf2e6]">{name}（{style}）</p>
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
            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(246,238,227,0.94)] px-3 py-2 text-xs font-semibold text-[#4a3721]"
              onClick={() => setScene("intro")}
            >
              返回角色设置
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 w-[min(46vw,360px)] rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(33,26,16,0.58)] p-4 text-left text-[#f5ebd8] backdrop-blur-md shadow-[0_14px_24px_rgba(52,39,22,0.4)]">
            <p className="text-xs text-[#e0cda8]">基础任务</p>
            <p className="mt-1 font-display text-2xl">关卡1：保护稻田</p>
            <p className="mt-1 text-xs text-[#e9dcc3]">
              {hasSeenFarmPrologue
                ? "已看过序幕，可直接进入，也可以重看"
                : completedFarm
                  ? "已完成，可再次挑战"
                  : "先看小麦的序幕，再开始教小麦"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-xl bg-[rgba(255,243,218,0.96)] px-4 py-2 text-sm font-semibold text-[#4a3422]"
                onClick={() => handleEnterFarm({ origin: "select" })}
              >
                {hasSeenFarmPrologue ? "直接进入" : "观看序幕"}
              </button>
              {hasSeenFarmPrologue ? (
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#f7ebd3]"
                  onClick={() => handleEnterFarm({ origin: "select", forcePrologue: true })}
                >
                  重看序幕
                </button>
              ) : null}
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
        </>
      )}
    </div>
  );
}
