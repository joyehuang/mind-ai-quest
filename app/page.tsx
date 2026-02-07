"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import ArchiveQuest from "@/components/archive/ArchiveQuest";
import FarmQuest from "@/components/farm/FarmQuest";
import { GameBadge, GameButton, GamePanel, GameProgress } from "@/components/ui/GameUI";

type Scene = "intro" | "select" | "farm" | "archive";

const STYLE_OPTIONS = ["侦查员", "工程师", "探险家"];

const QuestScene3D = dynamic(() => import("../components/QuestScene3D"), {
  ssr: false,
});

export default function Home() {
  const [scene, setScene] = useState<Scene>("intro");
  const [name, setName] = useState("小麦");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [completedFarm, setCompletedFarm] = useState(false);
  const [completedArchive, setCompletedArchive] = useState(false);

  const completion = useMemo(() => {
    const done = Number(completedFarm) + Number(completedArchive);
    return (done / 2) * 100;
  }, [completedArchive, completedFarm]);

  return (
    <div className="game-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <GamePanel variant="strong" className="game-topbar mb-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl text-[#8fe8ff]">Mind AI Quest</p>
              <p className="mt-1 text-sm text-[#76c9eb]">
                Cyber Hackathon Edition · 训练你的 AI 守护者
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GameBadge variant="info">Build v0.2 Demo</GameBadge>
              <GameBadge variant="success">2 Mission Packs</GameBadge>
            </div>
          </div>
        </GamePanel>

        {scene === "intro" && (
          <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <GamePanel variant="strong" glow className="p-6">
              <GameBadge variant="info">BOOT SEQUENCE</GameBadge>
              <h1 className="font-display mt-4 text-4xl leading-tight text-[#b9f3ff] sm:text-5xl">
                进入 AI 训练宇宙
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#96d7f4]">
                你将通过两个可交互任务关卡学习机器学习：监督学习闭环与异常检测闭环。
                选择角色后，立即开始闯关。
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#2f86ad] bg-[#07172b]">
                <QuestScene3D />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#2b84ac] bg-[rgba(8,29,52,0.82)] p-3">
                  <p className="text-[11px] text-[#83d2ef]">MISSION 01</p>
                  <p className="mt-1 text-sm text-[#cdf2ff]">稻田监督学习</p>
                </div>
                <div className="rounded-2xl border border-[#2b84ac] bg-[rgba(8,29,52,0.82)] p-3">
                  <p className="text-[11px] text-[#83d2ef]">MISSION 02</p>
                  <p className="mt-1 text-sm text-[#cdf2ff]">文枢阁异常检测</p>
                </div>
                <div className="rounded-2xl border border-[#2b84ac] bg-[rgba(8,29,52,0.82)] p-3">
                  <p className="text-[11px] text-[#83d2ef]">GOAL</p>
                  <p className="mt-1 text-sm text-[#cdf2ff]">让模型更可靠</p>
                </div>
              </div>
            </GamePanel>

            <GamePanel variant="soft" className="p-6">
              <h2 className="text-lg font-semibold text-[#abecff]">角色配置终端</h2>
              <label className="mt-4 block text-sm text-[#88cce8]">
                助手昵称
                <input
                  className="game-input mt-2 w-full rounded-xl px-3 py-2 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={12}
                />
              </label>

              <p className="mt-4 text-sm text-[#88cce8]">职业模板</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((item) => (
                  <GameButton
                    key={item}
                    type="button"
                    variant={style === item ? "primary" : "secondary"}
                    className="px-2 py-2 text-sm"
                    onClick={() => setStyle(item)}
                  >
                    {item}
                  </GameButton>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#2d87ad] bg-[rgba(8,30,54,0.74)] p-4">
                <p className="text-xs text-[#7ec9e7]">当前配置</p>
                <p className="mt-1 text-sm text-[#d5f5ff]">
                  {name} · {style}
                </p>
              </div>

              <GameButton
                type="button"
                variant="primary"
                className="mt-6 w-full px-4 py-3 text-sm disabled:bg-[#3f5772]"
                disabled={!name.trim()}
                onClick={() => setScene("select")}
              >
                启动任务大厅
              </GameButton>
            </GamePanel>
          </section>
        )}

        {scene === "select" && (
          <section className="space-y-5">
            <GamePanel variant="soft" className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#9adaf4]">
                    指挥官：{name}（{style}）
                  </p>
                  <p className="mt-1 text-xs text-[#76c3e3]">
                    任务状态 · 关卡1：{completedFarm ? "已完成" : "待挑战"} · 关卡2：{completedArchive ? "已完成" : "待挑战"}
                  </p>
                </div>
                <div className="min-w-[230px]">
                  <p className="text-xs text-[#7ac8e8]">总进度 {Math.round(completion)}%</p>
                  <GameProgress value={completion} className="mt-2" />
                </div>
              </div>
            </GamePanel>

            <div className="grid gap-5 lg:grid-cols-2">
              <GamePanel variant="strong" className="p-5">
                <GameBadge variant="success">MISSION 01</GameBadge>
                <h2 className="mt-4 text-xl font-semibold text-[#c6f4ff]">主题关卡1：保护我们的稻田</h2>
                <p className="mt-2 text-sm text-[#8fd0ec]">
                  监督学习闭环：收集数据、人工打标签、训练测试、纠错与调参。
                </p>
                <div className="mt-4 rounded-xl border border-[#2d87ad] bg-[rgba(8,30,54,0.74)] p-3 text-xs text-[#8acde9]">
                  推荐目标：理解训练集质量如何影响测试集表现。
                </div>
                <GameButton
                  type="button"
                  variant="success"
                  className="mt-5 w-full px-4 py-3 text-sm"
                  onClick={() => setScene("farm")}
                >
                  {completedFarm ? "再次挑战" : "进入关卡"}
                </GameButton>
              </GamePanel>

              <GamePanel variant="strong" className="p-5">
                <GameBadge variant="info">MISSION 02</GameBadge>
                <h2 className="mt-4 text-xl font-semibold text-[#c6f4ff]">主题关卡2：文枢阁的健康日记</h2>
                <p className="mt-2 text-sm text-[#8fd0ec]">
                  异常检测闭环：建立正常基线、发现偏离、复核告警、迭代优化。
                </p>
                <div className="mt-4 rounded-xl border border-[#2d87ad] bg-[rgba(8,30,54,0.74)] p-3 text-xs text-[#8acde9]">
                  推荐目标：理解“学正常再找异常”的工程方法。
                </div>
                <GameButton
                  type="button"
                  variant="primary"
                  className="mt-5 w-full px-4 py-3 text-sm"
                  onClick={() => setScene("archive")}
                >
                  {completedArchive ? "再次挑战" : "进入关卡"}
                </GameButton>
              </GamePanel>
            </div>

            <GameButton
              type="button"
              variant="secondary"
              className="px-4 py-2 text-sm"
              onClick={() => setScene("intro")}
            >
              返回角色设置
            </GameButton>
          </section>
        )}

        {scene === "farm" && (
          <FarmQuest
            playerName={name}
            playerStyle={style}
            onBack={() => setScene("select")}
            onComplete={() => {
              setCompletedFarm(true);
              setScene("select");
            }}
          />
        )}

        {scene === "archive" && (
          <ArchiveQuest
            playerName={name}
            playerStyle={style}
            onBack={() => setScene("select")}
            onComplete={() => {
              setCompletedArchive(true);
              setScene("select");
            }}
          />
        )}
      </div>
    </div>
  );
}

