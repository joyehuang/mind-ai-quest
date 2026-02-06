"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import FarmQuest from "@/components/farm/FarmQuest";

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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 rounded-3xl border border-[#d9e8df] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_12px_30px_rgba(20,56,35,0.08)] backdrop-blur-sm">
          <p className="font-display text-2xl text-[#1e4932]">Mind AI Quest Demo</p>
          <p className="mt-1 text-sm text-[#4d6258]">关卡1已升级为可解释监督学习闭环 + 全程3D场景</p>
        </header>

        {scene === "intro" && (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-[#d5e5dc] bg-[rgba(255,255,255,0.9)] p-6">
              <p className="inline-flex rounded-full border border-[#c9dfd0] bg-[#f2fbf5] px-3 py-1 text-xs font-semibold text-[#2a6a47]">
                创建你的 AI 小助手
              </p>
              <h1 className="font-display mt-4 text-4xl leading-tight text-[#1c4730] sm:text-5xl">用游戏学 AI</h1>
              <p className="mt-4 text-sm leading-7 text-[#4a6154]">
                关卡1会带你完成：收集特征、人工打标签、训练测试、纠错增量训练、超参数调优与防泄露终测。
              </p>
              <div className="mt-5">
                <QuestScene3D />
                <p className="mt-2 text-xs text-[#587065]">可拖动旋转预览，正式闯关时会进入稻田全程3D视图。</p>
              </div>
            </article>

            <article className="rounded-3xl border border-[#d4e4da] bg-[rgba(255,255,255,0.94)] p-6">
              <h2 className="text-lg font-semibold text-[#234535]">角色设置</h2>
              <label className="mt-4 block text-sm text-[#426153]">
                小助手昵称
                <input
                  className="mt-2 w-full rounded-xl border border-[#c8dace] bg-[#fafdfb] px-3 py-2 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={12}
                />
              </label>

              <p className="mt-4 text-sm text-[#426153]">角色风格</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-xl border px-2 py-2 text-sm ${
                      style === item
                        ? "border-[#2a8a5c] bg-[#e9f8ef] text-[#1f7045]"
                        : "border-[#d3ddd6] bg-[#f9fcfa] text-[#456253]"
                    }`}
                    onClick={() => setStyle(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-[#1f8a5b] px-4 py-3 text-sm font-semibold text-white disabled:bg-[#97bca7]"
                disabled={!name.trim()}
                onClick={() => setScene("select")}
              >
                开始冒险
              </button>
            </article>
          </section>
        )}

        {scene === "select" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-[#d5e5dc] bg-[rgba(255,255,255,0.88)] p-4">
              <p className="text-sm text-[#3d5a4b]">
                伙伴：{name}（{style}）
              </p>
              <p className="mt-1 text-xs text-[#5c7266]">关卡1状态：{completedFarm ? "已完成" : "待挑战"}</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl border border-[#d5e2db] bg-[rgba(255,255,255,0.92)] p-5">
                <span className="rounded-full border border-[#c5d6cc] bg-[#f1f7f3] px-3 py-1 text-xs text-[#355343]">
                  基础
                </span>
                <h2 className="mt-4 text-xl font-semibold text-[#203f31]">主题关卡1：保护我们的稻田</h2>
                <p className="mt-2 text-sm text-[#415e4f]">监督学习闭环：训练集、测试集、增量训练、防泄露终测。</p>
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-[#1f8a5b] px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => setScene("farm")}
                >
                  {completedFarm ? "再次挑战" : "进入关卡"}
                </button>
              </article>

              <article className="rounded-3xl border border-[#d5e2db] bg-[rgba(255,255,255,0.92)] p-5">
                <span className="rounded-full border border-[#cfd8e6] bg-[#f1f5fb] px-3 py-1 text-xs text-[#42536d]">
                  进阶
                </span>
                <h2 className="mt-4 text-xl font-semibold text-[#2a3f58]">主题关卡2：文枢阁的健康日记</h2>
                <p className="mt-2 text-sm text-[#566f84]">本轮先聚焦关卡1，关卡2保留演示入口。</p>
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-[#2c78a8] px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => setScene("archive")}
                >
                  查看关卡2
                </button>
              </article>
            </div>

            <button
              type="button"
              className="rounded-xl border border-[#cddcd3] bg-[rgba(255,255,255,0.82)] px-4 py-2 text-sm text-[#3f5c4d]"
              onClick={() => setScene("intro")}
            >
              返回角色设置
            </button>
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
          <section className="space-y-4">
            <div className="rounded-3xl border border-[#cfdeeb] bg-[rgba(255,255,255,0.92)] p-6">
              <h2 className="text-xl font-semibold text-[#2d4c66]">主题关卡2：文枢阁的健康日记</h2>
              <p className="mt-2 text-sm leading-7 text-[#4d6982]">
                当前版本重点优化了关卡1教学闭环。关卡2保留基础入口，后续会按同样可解释逻辑升级。
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#4d6982]">
                <li>建立健康基线</li>
                <li>排除异常干扰</li>
                <li>监测异常点并调阈值</li>
              </ul>
            </div>

            <button
              type="button"
              className="rounded-xl border border-[#cfdce7] bg-white px-4 py-2 text-sm text-[#3f5f78]"
              onClick={() => setScene("select")}
            >
              返回关卡选择
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
