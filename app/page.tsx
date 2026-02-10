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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(16, 185, 129, 0.3) 35px, rgba(16, 185, 129, 0.3) 36px),
                           repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(16, 185, 129, 0.3) 35px, rgba(16, 185, 129, 0.3) 36px)`
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        {/* Header - Game Title Style */}
        <header className="mb-8 animate-[fadeInDown_0.6s_ease-out]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 backdrop-blur-sm p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
            <div className="relative">
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 tracking-wide">
                MIND AI QUEST
              </h1>
              <p className="mt-2 text-sm sm:text-base text-emerald-300/80 font-medium">
                关卡1 · 监督学习闭环 · 3D 沉浸式体验
              </p>
            </div>
            {/* Decorative pixel corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
          </div>
        </header>

        {scene === "intro" && (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] animate-[fadeInUp_0.8s_ease-out]">
            {/* Hero Card */}
            <article className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-emerald-500/40 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20">
              {/* Glowing accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  创建你的 AI 小助手
                </div>

                <h2 className="font-display mt-6 text-4xl sm:text-5xl font-bold text-white leading-tight">
                  用游戏<span className="text-emerald-400">学 AI</span>
                </h2>

                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  完成监督学习完整闭环：收集特征 → 人工打标签 → 训练测试 → 纠错增量训练 → 超参数调优与防泄露终测
                </p>

                <div className="mt-6 space-y-3">
                  <div className="relative rounded-xl bg-slate-900/60 border border-slate-700/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />
                    <QuestScene3D />
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-emerald-400">提示</span>
                    可拖动旋转预览，正式闯关时会进入稻田全程3D视图
                  </p>
                </div>
              </div>
            </article>

            {/* Character Setup Panel */}
            <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-amber-500/40 backdrop-blur-sm p-6">
              {/* Glowing accent */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />

              <div className="relative">
                <h3 className="font-display text-2xl font-bold text-amber-400 flex items-center gap-2">
                  角色设置
                </h3>

                <div className="mt-6 space-y-5">
                  {/* Name Input */}
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300 mb-2 block">小助手昵称</span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border-2 border-slate-600 bg-slate-900/80 px-4 py-3 text-white font-medium transition-all duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-500"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={12}
                        placeholder="输入昵称..."
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {name.length}/12
                      </div>
                    </div>
                  </label>

                  {/* Style Selection */}
                  <div>
                    <span className="text-sm font-semibold text-slate-300 mb-3 block">角色风格</span>
                    <div className="grid grid-cols-3 gap-2">
                      {STYLE_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`relative overflow-hidden rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                            style === item
                              ? "border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-300 shadow-lg shadow-amber-500/20"
                              : "border-slate-600 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                          }`}
                          onClick={() => setStyle(item)}
                        >
                          {style === item && (
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent" />
                          )}
                          <span className="relative">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    type="button"
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/50 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={!name.trim()}
                    onClick={() => setScene("select")}
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {name.trim() ? "开始冒险 →" : "请输入昵称"}
                    </span>
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </button>
                </div>
              </div>

              {/* Decorative pixel corners */}
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/50" />
            </article>
          </section>
        )}

        {scene === "select" && (
          <section className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Player Info Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30 backdrop-blur-sm p-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="relative flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lg">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300/80 uppercase tracking-wider">伙伴</p>
                    <p className="text-lg font-bold text-white">{name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                    {style}
                  </span>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">关卡1状态</p>
                  <p className={`text-sm font-bold ${completedFarm ? "text-emerald-400" : "text-amber-400"}`}>
                    {completedFarm ? "已完成" : "待挑战"}
                  </p>
                </div>
              </div>
            </div>

            {/* Level Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Level 1 */}
              <article className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-emerald-500/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/70 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500" />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl border-2 border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Level 1
                    </span>
                    <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      基础
                    </span>
                  </div>

                  <h2 className="font-display mt-5 text-2xl font-bold text-white">
                    保护我们的稻田
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    监督学习完整闭环：训练集构建、测试集验证、增量训练优化、防泄露终测
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs text-emerald-300 border border-emerald-500/30">收集特征</span>
                    <span className="rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs text-teal-300 border border-teal-500/30">数据标注</span>
                    <span className="rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs text-cyan-300 border border-cyan-500/30">模型训练</span>
                    <span className="rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs text-sky-300 border border-sky-500/30">增量优化</span>
                  </div>

                  <button
                    type="button"
                    className="mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/50 active:scale-[0.98]"
                    onClick={() => setScene("farm")}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {completedFarm ? "再次挑战" : "进入关卡"}
                    </span>
                  </button>
                </div>

                {/* Corner accents */}
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </article>

              {/* Level 2 - Locked/Coming Soon */}
              <article className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-slate-600/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-slate-500/70">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-900/20" />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl border-2 border-slate-500/50 bg-slate-700/30 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Level 2
                    </span>
                    <span className="rounded-full border border-slate-500/50 bg-slate-700/30 px-3 py-1 text-xs text-slate-400">
                      进阶
                    </span>
                  </div>

                  <h2 className="font-display mt-5 text-2xl font-bold text-slate-300">
                    文枢阁的健康日记
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    异常检测与基线建立：建立健康基线、排除异常干扰、监测异常点并调阈值
                  </p>

                  <div className="mt-6 rounded-xl bg-slate-900/60 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-amber-400">开发中</span><br />
                      本轮先聚焦关卡1教学闭环，关卡2保留演示入口
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl border-2 border-slate-600 bg-slate-800/60 px-5 py-4 text-sm font-semibold text-slate-400 transition-all duration-300 hover:border-slate-500 hover:text-slate-300"
                    onClick={() => setScene("archive")}
                  >
                    查看关卡2详情
                  </button>
                </div>

                {/* Corner accents */}
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-500" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-500" />
              </article>
            </div>

            {/* Back Button */}
            <button
              type="button"
              className="rounded-xl border-2 border-slate-600/50 bg-slate-800/40 px-5 py-3 text-sm text-slate-400 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              onClick={() => setScene("intro")}
            >
              ← 返回角色设置
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
          <section className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-slate-600/50 backdrop-blur-sm p-6">
              <h2 className="font-display text-2xl font-bold text-slate-300">
                文枢阁的健康日记
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                当前版本重点优化了关卡1教学闭环。关卡2保留基础入口，后续会按同样可解释逻辑升级。
              </p>
              <ul className="mt-5 space-y-3">
                {["建立健康基线", "排除异常干扰", "监测异常点并调阈值"].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700/50 text-xs font-bold text-slate-500">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="rounded-xl border-2 border-slate-600/50 bg-slate-800/40 px-5 py-3 text-sm text-slate-400 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              onClick={() => setScene("select")}
            >
              ← 返回关卡选择
            </button>
          </section>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
