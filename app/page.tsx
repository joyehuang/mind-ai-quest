"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

type Scene = "intro" | "select" | "play";
type Quest = "farm" | "archive";
type Label = "healthy" | "diseased";

interface FarmSample {
  id: number;
  title: string;
  type: Label;
  hint: string;
}

const QUEST_META: Record<Quest, { title: string; subtitle: string; difficulty: string }> = {
  farm: {
    title: "主题关卡1：保护我们的稻田",
    subtitle: "收集样本、标注训练并优化识别模型",
    difficulty: "基础",
  },
  archive: {
    title: "主题关卡2：文枢阁的健康日记",
    subtitle: "建立基线、监测异常并迭代阈值",
    difficulty: "进阶",
  },
};

const FARM_STEPS = ["收集数据", "标注训练", "AI学习中", "测试成果", "迭代优化"];
const ARCHIVE_STEPS = ["认识健康日记", "建立正常基线", "AI学习中", "发现异常", "迭代优化"];
const STYLE_OPTIONS = ["侦查员", "工程师", "探险家"];
const FARM_COLLECTION_TARGET = 10;

const QuestScene3D = dynamic(() => import("../components/QuestScene3D"), {
  ssr: false,
});

const FARM_SAMPLES: FarmSample[] = [
  { id: 1, title: "样本 A1", type: "healthy", hint: "叶色均匀、纹理完整" },
  { id: 2, title: "样本 A2", type: "healthy", hint: "茎秆挺直、亮度稳定" },
  { id: 3, title: "样本 A3", type: "healthy", hint: "无斑点、边缘平滑" },
  { id: 4, title: "样本 A4", type: "healthy", hint: "叶尖光泽正常" },
  { id: 5, title: "样本 A5", type: "healthy", hint: "脉络清晰、色差小" },
  { id: 6, title: "样本 B1", type: "diseased", hint: "叶面发黄、局部卷曲" },
  { id: 7, title: "样本 B2", type: "diseased", hint: "斑点扩散、边缘坏死" },
  { id: 8, title: "样本 B3", type: "diseased", hint: "纹理断裂、亮度偏暗" },
  { id: 9, title: "样本 B4", type: "diseased", hint: "叶尖干枯、色差明显" },
  { id: 10, title: "样本 B5", type: "diseased", hint: "叶脉失衡、局部萎蔫" },
];

const HISTORY = [
  0.68, 0.7, 0.72, 0.73, 0.71, 0.74, 0.75, 0.74, 0.73, 0.72, 0.74, 1.28, 0.72,
  0.71, 0.73, 0.74, 0.73, 0.72, 0.71, 0.74, 0.75, 0.74, 0.73, 1.25, 0.72, 0.71,
  0.73, 0.74, 0.75, 0.73,
].map((value, index) => ({ day: index + 1, value }));

const MONITOR = [
  { day: 1, value: 0.74, realAnomaly: false },
  { day: 2, value: 0.73, realAnomaly: false },
  { day: 3, value: 1.34, realAnomaly: true },
  { day: 4, value: 0.72, realAnomaly: false },
  { day: 5, value: 0.75, realAnomaly: false },
  { day: 6, value: 1.3, realAnomaly: true },
  { day: 7, value: 0.74, realAnomaly: false },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const score = (value: number) => `${Math.round(value * 100)}%`;
const sensitivityText = (value: number) => (value === 1 ? "宽松" : value === 2 ? "平衡" : "严格");
const anomalyFactor = (value: number) => (value === 1 ? 3 : value === 2 ? 2 : 1.5);

function stats(values: number[]) {
  if (values.length === 0) {
    return { mean: 0, std: 0, low: 0, high: 0 };
  }

  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  return { mean, std, low: mean - 2 * std, high: mean + 2 * std };
}

export default function Home() {
  const [scene, setScene] = useState<Scene>("intro");
  const [name, setName] = useState("小麦");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [quest, setQuest] = useState<Quest>("farm");
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Record<Quest, boolean>>({ farm: false, archive: false });

  const [farmCollectedIds, setFarmCollectedIds] = useState<number[]>([]);
  const [farmMark, setFarmMark] = useState<Record<number, Label>>({});
  const [farmIndex, setFarmIndex] = useState(0);
  const [farmHint, setFarmHint] = useState("先教我给样本贴标签。");
  const [farmTrain, setFarmTrain] = useState(0);
  const [farmSensitivity, setFarmSensitivity] = useState(2);
  const [farmRounds, setFarmRounds] = useState(2);
  const [farmDataBoost, setFarmDataBoost] = useState(0);
  const [farmOptimized, setFarmOptimized] = useState<number | null>(null);

  const [archiveDrop, setArchiveDrop] = useState<number[]>([]);
  const [archiveStart, setArchiveStart] = useState(4);
  const [archiveEnd, setArchiveEnd] = useState(11);
  const [archiveTrain, setArchiveTrain] = useState(0);
  const [archiveReview, setArchiveReview] = useState<Record<number, boolean>>({});
  const [archiveSensitivity, setArchiveSensitivity] = useState(2);
  const [archiveSigmaScale, setArchiveSigmaScale] = useState(1);
  const [archiveResult, setArchiveResult] = useState<{ falseAlarm: number; miss: number } | null>(null);

  const steps = quest === "farm" ? FARM_STEPS : ARCHIVE_STEPS;
  const progress = ((step + 1) / steps.length) * 100;

  const farmCollectedCount = farmCollectedIds.length;
  const farmCollectionProgress = clamp((farmCollectedCount / FARM_COLLECTION_TARGET) * 100, 0, 100);

  const farmSet = useMemo(
    () => FARM_SAMPLES.filter((sample) => farmCollectedIds.includes(sample.id)),
    [farmCollectedIds],
  );

  const farmCurrent = farmSet[farmIndex] ?? null;

  const farmLabeled = useMemo(
    () => farmSet.filter((sample) => farmMark[sample.id] !== undefined).length,
    [farmMark, farmSet],
  );

  const farmLabelCounts = useMemo(() => {
    const scoped = farmSet
      .map((sample) => farmMark[sample.id])
      .filter((value): value is Label => value !== undefined);
    return {
      healthy: scoped.filter((value) => value === "healthy").length,
      diseased: scoped.filter((value) => value === "diseased").length,
    };
  }, [farmMark, farmSet]);

  const farmAccuracy = useMemo(() => {
    const labeled = farmSet.filter((sample) => farmMark[sample.id] !== undefined);
    if (labeled.length === 0) {
      return 0;
    }
    const correct = labeled.filter((sample) => farmMark[sample.id] === sample.type).length;
    return correct / labeled.length;
  }, [farmMark, farmSet]);

  const farmTest = useMemo(() => {
    const testSet = FARM_SAMPLES.slice(0, 8);
    const coverageBoost = clamp((farmCollectedCount - 6) * 0.01, 0, 0.08);
    const sensitivityBoost = farmSensitivity === 1 ? -0.03 : farmSensitivity === 2 ? 0.02 : 0.05;
    const targetAccuracy = clamp(0.42 + farmAccuracy * 0.44 + coverageBoost + sensitivityBoost, 0.35, 0.95);
    const targetCorrect = Math.round(targetAccuracy * testSet.length);

    const ranked = [...testSet].sort((a, b) => {
      const scoreA = ((a.id * 17 + farmSensitivity * 9) % 100) / 100;
      const scoreB = ((b.id * 17 + farmSensitivity * 9) % 100) / 100;
      return scoreA - scoreB;
    });
    const correctSet = new Set(ranked.slice(0, targetCorrect).map((sample) => sample.id));

    const rows = testSet.map((sample) => {
      const predicted = correctSet.has(sample.id)
        ? sample.type
        : sample.type === "healthy"
          ? "diseased"
          : "healthy";
      return { ...sample, predicted };
    });

    const correct = rows.filter((row) => row.type === row.predicted).length;
    const diseasedRows = rows.filter((row) => row.type === "diseased");
    const truePositive = diseasedRows.filter((row) => row.predicted === "diseased").length;
    const falseNegative = diseasedRows.length - truePositive;
    const healthyRows = rows.filter((row) => row.type === "healthy");
    const trueNegative = healthyRows.filter((row) => row.predicted === "healthy").length;
    const falsePositive = healthyRows.length - trueNegative;
    const recall = diseasedRows.length > 0 ? truePositive / diseasedRows.length : 0;

    return {
      rows,
      correct,
      total: rows.length,
      truePositive,
      trueNegative,
      falsePositive,
      falseNegative,
      accuracy: rows.length > 0 ? correct / rows.length : 0,
      recall,
    };
  }, [farmAccuracy, farmCollectedCount, farmSensitivity]);

  const baselineDays = useMemo(() => {
    const days: number[] = [];
    for (let day = archiveStart + 1; day <= archiveEnd + 1; day += 1) {
      days.push(day);
    }
    return days;
  }, [archiveEnd, archiveStart]);

  const baselineHasDrop = useMemo(
    () => baselineDays.some((day) => archiveDrop.includes(day)),
    [archiveDrop, baselineDays],
  );

  const baselineValues = useMemo(
    () =>
      HISTORY.filter((point) => baselineDays.includes(point.day) && !archiveDrop.includes(point.day)).map(
        (point) => point.value,
      ),
    [archiveDrop, baselineDays],
  );

  const baselineStats = useMemo(() => stats(baselineValues), [baselineValues]);

  const monitor = useMemo(() => {
    const factor = anomalyFactor(archiveSensitivity) * archiveSigmaScale;
    return MONITOR.map((point) => ({
      ...point,
      predicted: Math.abs(point.value - baselineStats.mean) > baselineStats.std * factor,
    }));
  }, [archiveSensitivity, archiveSigmaScale, baselineStats.mean, baselineStats.std]);

  const reviewCount = useMemo(() => Object.keys(archiveReview).length, [archiveReview]);

  const reviewAccuracy = useMemo(() => {
    if (reviewCount === 0) {
      return 0;
    }
    const correct = monitor.filter((point) => archiveReview[point.day] === point.realAnomaly).length;
    return correct / reviewCount;
  }, [archiveReview, monitor, reviewCount]);

  const canNext = useMemo(() => {
    if (quest === "farm") {
      if (step === 0) return farmCollectedCount >= FARM_COLLECTION_TARGET;
      if (step === 1) return farmLabeled >= farmSet.length;
      if (step === 2) return farmTrain >= 100;
      if (step === 3) return true;
      return farmOptimized !== null;
    }

    if (step === 0) return archiveDrop.length >= 1;
    if (step === 1) return baselineValues.length >= 5 && !baselineHasDrop;
    if (step === 2) return archiveTrain >= 100;
    if (step === 3) return reviewCount >= monitor.length;
    return archiveResult !== null;
  }, [
    archiveDrop.length,
    archiveResult,
    archiveTrain,
    baselineHasDrop,
    baselineValues.length,
    farmCollectedCount,
    farmLabeled,
    farmOptimized,
    farmSet.length,
    farmTrain,
    monitor.length,
    quest,
    reviewCount,
    step,
  ]);

  const speech = useMemo(() => {
    if (scene === "intro") return "先创建我的身份，然后一起闯关。";
    if (scene === "select") return "两条线路都准备好了，按顺序挑战更清晰。";
    if (quest === "farm") {
      if (step === 0) return `采集进度 ${farmCollectedCount}/${FARM_COLLECTION_TARGET}，先收集再标注。`;
      if (step === 1) return `标注进度 ${farmLabeled}/${farmSet.length}，继续。`;
      if (step === 2) return farmTrain >= 100 ? "训练完成，进入测试。" : "训练中，正在提取特征。";
      if (step === 3) return `当前准确率 ${score(farmTest.accuracy)}，可以调参优化。`;
      return "调灵敏度、迭代轮次和数据增强，比较优化前后效果。";
    }
    if (step === 0) return "先剔除明显异常日期，避免基线污染。";
    if (step === 1) return "选择连续、平稳区间建立健康基线。";
    if (step === 2) return archiveTrain >= 100 ? "学习完成，开始监测。" : "正在计算均值和波动范围。";
    if (step === 3) return `已复核 ${reviewCount}/${monitor.length} 天。`;
    return "最后一步：模拟不同灵敏度设置。";
  }, [
    archiveTrain,
    farmCollectedCount,
    farmLabeled,
    farmSet.length,
    farmTest.accuracy,
    farmTrain,
    monitor.length,
    quest,
    reviewCount,
    scene,
    step,
  ]);

  useEffect(() => {
    if (scene !== "play" || quest !== "farm" || step !== 2 || farmTrain >= 100) return;
    const timer = setInterval(() => setFarmTrain((value) => clamp(value + 8, 0, 100)), 450);
    return () => clearInterval(timer);
  }, [farmTrain, quest, scene, step]);

  useEffect(() => {
    if (scene !== "play" || quest !== "archive" || step !== 2 || archiveTrain >= 100) return;
    const timer = setInterval(() => setArchiveTrain((value) => clamp(value + 9, 0, 100)), 460);
    return () => clearInterval(timer);
  }, [archiveTrain, quest, scene, step]);

  function resetQuestState(target: Quest) {
    if (target === "farm") {
      setFarmCollectedIds([]);
      setFarmMark({});
      setFarmIndex(0);
      setFarmHint("先教我给样本贴标签。");
      setFarmTrain(0);
      setFarmSensitivity(2);
      setFarmRounds(2);
      setFarmDataBoost(0);
      setFarmOptimized(null);
      return;
    }

    setArchiveDrop([]);
    setArchiveStart(4);
    setArchiveEnd(11);
    setArchiveTrain(0);
    setArchiveReview({});
    setArchiveSensitivity(2);
    setArchiveSigmaScale(1);
    setArchiveResult(null);
  }

  function startQuest(target: Quest) {
    setQuest(target);
    setStep(0);
    setScene("play");
  }

  function nextStep() {
    if (!canNext) return;
    if (step >= steps.length - 1) {
      setCompleted((previous) => ({ ...previous, [quest]: true }));
      setStep(0);
      setScene("select");
      return;
    }
    setStep((value) => value + 1);
  }

  function previousStep() {
    if (step === 0) {
      setScene("select");
      return;
    }
    setStep((value) => Math.max(0, value - 1));
  }

  function toggleFarmCollection(sampleId: number) {
    setFarmCollectedIds((previous) =>
      previous.includes(sampleId)
        ? previous.filter((id) => id !== sampleId)
        : [...previous, sampleId].slice(0, FARM_COLLECTION_TARGET + 2),
    );
  }

  function markFarm(bucket: Label) {
    if (!farmCurrent) return;
    const correct = farmCurrent.type === bucket;
    setFarmMark((previous) => ({ ...previous, [farmCurrent.id]: bucket }));
    setFarmHint(correct ? "正确，这条样本特征判断稳定。" : "这条可能分错了，再观察叶色与纹理。");
    if (farmIndex < farmSet.length - 1) setFarmIndex((value) => value + 1);
  }

  function simulateFarm() {
    const sensitivityBoost = farmSensitivity === 3 ? 0.06 : farmSensitivity === 2 ? 0.03 : 0.01;
    const roundsBoost = (farmRounds - 1) * 0.018;
    const dataBoost = farmDataBoost * 0.015;
    setFarmOptimized(clamp(farmTest.accuracy + sensitivityBoost + roundsBoost + dataBoost, 0, 0.99));
  }

  function simulateArchive() {
    const factor = anomalyFactor(archiveSensitivity) * archiveSigmaScale;
    if (factor >= 2.8) {
      setArchiveResult({ falseAlarm: 0, miss: 1 });
      return;
    }
    if (factor >= 2.0) {
      setArchiveResult({ falseAlarm: 0, miss: 0 });
      return;
    }
    setArchiveResult({ falseAlarm: 1, miss: 0 });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 rounded-3xl border border-[#d9e8df] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_12px_30px_rgba(20,56,35,0.08)] backdrop-blur-sm">
          <p className="font-display text-2xl text-[#1e4932]">Mind AI Quest Demo</p>
          <p className="mt-1 text-sm text-[#4d6258]">Next.js + TypeScript + TailwindCSS 初版交互原型</p>
        </header>

        {scene === "intro" && (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-[#d5e5dc] bg-[rgba(255,255,255,0.9)] p-6">
              <p className="inline-flex rounded-full border border-[#c9dfd0] bg-[#f2fbf5] px-3 py-1 text-xs font-semibold text-[#2a6a47]">
                创建你的 AI 小助手
              </p>
              <h1 className="font-display mt-4 text-4xl leading-tight text-[#1c4730] sm:text-5xl">用游戏学 AI</h1>
              <p className="mt-4 text-sm leading-7 text-[#4a6154]">
                开场创建角色后，进入双关卡流程：稻田识别（监督学习）与文枢阁监测（异常检测）。
              </p>
              <div className="mt-5">
                <QuestScene3D />
                <p className="mt-2 text-xs text-[#587065]">
                  3D 预览场景：左侧稻田任务、右侧文枢阁任务，可拖动旋转视角。
                </p>
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
                    className={`rounded-xl border px-2 py-2 text-sm ${style === item ? "border-[#2a8a5c] bg-[#e9f8ef] text-[#1f7045]" : "border-[#d3ddd6] bg-[#f9fcfa] text-[#456253]"}`}
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
              <p className="mt-1 text-xs text-[#5c7266]">
                已完成：{completed.farm ? "稻田" : "未完成"} / {completed.archive ? "文枢阁" : "未完成"}
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {(Object.keys(QUEST_META) as Quest[]).map((key) => (
                <article key={key} className="rounded-3xl border border-[#d5e2db] bg-[rgba(255,255,255,0.92)] p-5">
                  <span className="rounded-full border border-[#c5d6cc] bg-[#f1f7f3] px-3 py-1 text-xs text-[#355343]">
                    {QUEST_META[key].difficulty}
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-[#203f31]">{QUEST_META[key].title}</h2>
                  <p className="mt-2 text-sm text-[#415e4f]">{QUEST_META[key].subtitle}</p>
                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl bg-[#1f8a5b] px-4 py-3 text-sm font-semibold text-white"
                    onClick={() => startQuest(key)}
                  >
                    {completed[key] ? "再次挑战" : "进入关卡"}
                  </button>
                </article>
              ))}
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

        {scene === "play" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-[#d5e4dc] bg-[rgba(255,255,255,0.9)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-[#214031]">{QUEST_META[quest].title}</h2>
                <span className="text-sm text-[#4f6659]">
                  第 {step + 1} 步 / 共 {steps.length} 步
                </span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-[#deebe4] p-[2px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2a8d5d] to-[#87d09f]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-5">
                {steps.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-xl border px-2 py-2 text-xs ${index <= step ? "border-[#8dbfa2] bg-[#eaf7ef] text-[#1f5f3e]" : "border-[#d9e2dc] bg-[#f7faf8] text-[#60766a]"}`}
                    disabled={index > step}
                    onClick={() => index <= step && setStep(index)}
                  >
                    {index + 1}. {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
              <aside className="rounded-3xl border border-[#d4e3da] bg-[rgba(255,255,255,0.9)] p-5">
                <div className="rounded-2xl border border-[#cde0d3] bg-[#f4fbf7] p-4">
                  <p className="text-xs text-[#587264]">AI 小助手</p>
                  <p className="mt-1 text-lg font-semibold text-[#234534]">{name}</p>
                  <p className="text-xs text-[#5a7366]">{style}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-[#d4e2db] bg-[#fafdfb] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#6a7f73]">实时对话</p>
                  <p className="mt-2 text-sm leading-6 text-[#2f4d3e]">{speech}</p>
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-xl border border-[#cfdcd4] bg-white px-3 py-2 text-sm text-[#3f5d4f]"
                  onClick={() => {
                    resetQuestState(quest);
                    setStep(0);
                  }}
                >
                  重置当前关卡
                </button>
              </aside>

              <main className="space-y-5 rounded-3xl border border-[#d5e4dc] bg-[rgba(255,255,255,0.94)] p-5">
                {quest === "farm" && step === 0 && (
                  <>
                    <div className="rounded-2xl border border-[#99c9aa] bg-[#edfff2] p-4">
                      <p className="text-sm text-[#24563a]">步骤1：只收集，不标注</p>
                      <p className="mt-2 text-lg font-semibold text-[#1e4f33]">
                        已收集 {farmCollectedCount}/{FARM_COLLECTION_TARGET} 张训练照片
                      </p>
                      <div className="mt-3 h-3 rounded-full bg-[#cfe8d9] p-[2px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2a8f5f] to-[#8ad7a3]"
                          style={{ width: `${farmCollectionProgress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[#426a54]">
                        这一阶段只把样本加入数据集，标签会在下一步统一完成。
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {FARM_SAMPLES.map((sample) => (
                        <article key={sample.id} className="rounded-2xl border border-[#d6e7dc] bg-white p-3">
                          <p className="text-sm font-semibold text-[#1f3528]">{sample.title}</p>
                          <p className="mt-1 text-xs text-[#5f7267]">{sample.hint}</p>
                          <div className="mt-3">
                            <button
                              type="button"
                              className={`w-full rounded-xl border px-2 py-2 text-xs ${farmCollectedIds.includes(sample.id) ? "border-[#2d8b5e] bg-[#e8f7ef] text-[#1f6f44]" : "border-[#cfded5] bg-[#f8fbf9] text-[#365044]"}`}
                              onClick={() => toggleFarmCollection(sample.id)}
                            >
                              {farmCollectedIds.includes(sample.id) ? "已加入数据集（点击移除）" : "加入数据集"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}

                {quest === "farm" && step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <p className="rounded-xl border border-[#cde0d3] bg-[#f7fcf9] px-3 py-3 text-sm text-[#315342]">
                        标注进度：{farmLabeled}/{farmSet.length}
                      </p>
                      <p className="rounded-xl border border-[#cde0d3] bg-[#f7fcf9] px-3 py-3 text-sm text-[#315342]">
                        健康标签：{farmLabelCounts.healthy}
                      </p>
                      <p className="rounded-xl border border-[#cde0d3] bg-[#f7fcf9] px-3 py-3 text-sm text-[#315342]">
                        病害标签：{farmLabelCounts.diseased}
                      </p>
                    </div>
                    {farmCurrent ? (
                      <div className="rounded-2xl border border-[#d3e4d8] bg-white p-4">
                        <p className="text-base font-semibold text-[#1f362a]">{farmCurrent.title}</p>
                        <p className="mt-1 text-sm text-[#53665b]">{farmCurrent.hint}</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            className="rounded-xl border border-[#7ab58f] bg-[#edfff3] px-3 py-3 text-[#1f7045]"
                            onClick={() => markFarm("healthy")}
                          >
                            标记为健康
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-[#dfae78] bg-[#fff6ea] px-3 py-3 text-[#8a561d]"
                            onClick={() => markFarm("diseased")}
                          >
                            标记为病害
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-xl border border-[#f0c893] bg-[#fff6ea] px-3 py-3 text-sm text-[#8c5a1e]">
                        还没有可标注样本，请先在步骤1收集至少 {FARM_COLLECTION_TARGET} 张照片。
                      </p>
                    )}
                    <p className="rounded-xl border border-[#d8e5dc] bg-[#f8fcf9] px-3 py-2 text-sm text-[#2f4d3e]">
                      {farmHint}
                    </p>
                  </>
                )}

                {quest === "farm" && step === 2 && (
                  <div className="rounded-2xl border border-[#bfd8c7] bg-[#f0fcf4] p-5">
                    <p className="text-base font-semibold text-[#234133]">AI 训练动画</p>
                    <p className="mt-2 text-xl font-semibold text-[#1f8a5b]">{farmTrain}%</p>
                    <div className="mt-3 h-4 rounded-full bg-[#d7ebdf] p-1">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2a9762] to-[#7bcf8e]"
                        style={{ width: `${farmTrain}%` }}
                      />
                    </div>
                  </div>
                )}

                {quest === "farm" && step === 3 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[#d3e4d8] bg-white p-4">
                        准确率：{score(farmTest.accuracy)}
                      </div>
                      <div className="rounded-2xl border border-[#d3e4d8] bg-white p-4">
                        病害召回率：{score(farmTest.recall)}
                      </div>
                      <div className="rounded-2xl border border-[#d3e4d8] bg-white p-4">
                        灵敏度：{sensitivityText(farmSensitivity)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#d4e4da] bg-[#f8fcf9] p-4 text-sm text-[#2e4b3d]">
                      准确率计算：预测正确数 / 测试总数 = {farmTest.correct} / {farmTest.total} ={" "}
                      {score(farmTest.accuracy)}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p className="rounded-xl border border-[#d4e4da] bg-white px-3 py-3 text-sm text-[#2e4b3d]">
                        真阳性 TP（病害判病害）：{farmTest.truePositive}
                      </p>
                      <p className="rounded-xl border border-[#d4e4da] bg-white px-3 py-3 text-sm text-[#2e4b3d]">
                        真阴性 TN（健康判健康）：{farmTest.trueNegative}
                      </p>
                      <p className="rounded-xl border border-[#d4e4da] bg-white px-3 py-3 text-sm text-[#2e4b3d]">
                        假阳性 FP（健康判病害）：{farmTest.falsePositive}
                      </p>
                      <p className="rounded-xl border border-[#d4e4da] bg-white px-3 py-3 text-sm text-[#2e4b3d]">
                        假阴性 FN（病害判健康）：{farmTest.falseNegative}
                      </p>
                    </div>
                  </>
                )}

                {quest === "farm" && step === 4 && (
                  <>
                    <p className="text-sm text-[#4f6458]">可调参数：灵敏度、迭代轮次、数据增强幅度。</p>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={1}
                      value={farmSensitivity}
                      onChange={(event) => setFarmSensitivity(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-[#567063]">灵敏度：{sensitivityText(farmSensitivity)}</p>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={farmRounds}
                      onChange={(event) => setFarmRounds(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-[#567063]">迭代轮次：{farmRounds} 轮</p>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={farmDataBoost}
                      onChange={(event) => setFarmDataBoost(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-[#567063]">数据增强：+{farmDataBoost * 10}%</p>
                    <button
                      type="button"
                      className="rounded-xl bg-[#1f8a5b] px-4 py-3 text-sm font-semibold text-white"
                      onClick={simulateFarm}
                    >
                      运行优化模拟
                    </button>
                    {farmOptimized !== null && (
                      <p className="rounded-2xl border border-[#c6e0cf] bg-[#effcf4] p-4 text-sm text-[#305240]">
                        优化前：{score(farmTest.accuracy)}，优化后：{score(farmOptimized)}
                      </p>
                    )}
                  </>
                )}

                {quest === "archive" && step === 0 && (
                  <>
                    <p className="text-sm text-[#516579]">点击异常日期进行剔除。</p>
                    <div className="overflow-x-auto rounded-2xl border border-[#c7d9ea] bg-white p-4">
                      <div className="flex min-w-[760px] items-end gap-2">
                        {HISTORY.map((point) => {
                          const dropped = archiveDrop.includes(point.day);
                          return (
                            <button
                              key={point.day}
                              type="button"
                              className={`flex w-8 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs ${dropped ? "bg-[#ffe9d8]" : "bg-[#f2f7fb]"}`}
                              onClick={() =>
                                setArchiveDrop((prev) =>
                                  prev.includes(point.day)
                                    ? prev.filter((item) => item !== point.day)
                                    : [...prev, point.day].sort((a, b) => a - b),
                                )
                              }
                            >
                              <span>{point.day}</span>
                              <span
                                className={`w-full rounded-t ${dropped ? "bg-[#d67d3f]" : "bg-[#7eb2d6]"}`}
                                style={{ height: `${36 + point.value * 90}px` }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="rounded-xl border border-[#cfddeb] bg-[#f4f9ff] px-3 py-2 text-sm text-[#36516b]">
                      已剔除：{archiveDrop.length ? archiveDrop.join("、") : "暂无"}
                    </p>
                  </>
                )}

                {quest === "archive" && step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="rounded-2xl border border-[#c6d7e8] bg-white p-4">
                        <p className="text-sm text-[#425c74]">起始日</p>
                        <select
                          className="mt-2 w-full rounded-lg border border-[#cdd9e5] bg-[#f9fbfd] px-3 py-2 text-sm"
                          value={archiveStart}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setArchiveStart(value);
                            if (archiveEnd < value + 4) setArchiveEnd(value + 4);
                          }}
                        >
                          {Array.from({ length: 26 }, (_, index) => index).map((value) => (
                            <option key={value} value={value}>
                              第 {value + 1} 天
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="rounded-2xl border border-[#c6d7e8] bg-white p-4">
                        <p className="text-sm text-[#425c74]">结束日</p>
                        <select
                          className="mt-2 w-full rounded-lg border border-[#cdd9e5] bg-[#f9fbfd] px-3 py-2 text-sm"
                          value={archiveEnd}
                          onChange={(event) => setArchiveEnd(Number(event.target.value))}
                        >
                          {Array.from({ length: 29 }, (_, index) => index + 1)
                            .filter((value) => value >= archiveStart + 4)
                            .map((value) => (
                              <option key={value} value={value}>
                                第 {value + 1} 天
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                    <p className="rounded-2xl border border-[#c6d7e8] bg-white p-4 text-sm text-[#3c556d]">
                      样本天数：{baselineValues.length}，正常范围：{baselineStats.low.toFixed(2)}° ~{" "}
                      {baselineStats.high.toFixed(2)}°
                    </p>
                    {baselineHasDrop && (
                      <p className="rounded-xl border border-[#f1c58c] bg-[#fff6e8] px-3 py-2 text-sm text-[#8e5a1d]">
                        当前区间包含已剔除日期，请调整。
                      </p>
                    )}
                  </>
                )}

                {quest === "archive" && step === 2 && (
                  <div className="rounded-2xl border border-[#c4d8ea] bg-[#f2f8ff] p-5">
                    <p className="text-base font-semibold text-[#26445f]">基线学习</p>
                    <p className="mt-2 text-xl font-semibold text-[#1f7db8]">{archiveTrain}%</p>
                    <div className="mt-3 h-4 rounded-full bg-[#d8e7f5] p-1">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2f7cad] to-[#74b7de]"
                        style={{ width: `${archiveTrain}%` }}
                      />
                    </div>
                  </div>
                )}

                {quest === "archive" && step === 3 && (
                  <>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {monitor.map((point) => (
                        <article key={point.day} className="rounded-2xl border border-[#cfdeeb] bg-white p-4">
                          <p className="text-sm font-semibold text-[#2f4f69]">第 {point.day} 天</p>
                          <p className="mt-1 text-sm text-[#4d677f]">倾斜角：{point.value.toFixed(2)}°</p>
                          <p className="mt-2 text-xs text-[#57718a]">AI 判断：{point.predicted ? "异常" : "正常"}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-[#d37e3f] bg-[#fff1e0] px-2 py-2 text-xs text-[#8a571f]"
                              onClick={() => setArchiveReview((prev) => ({ ...prev, [point.day]: true }))}
                            >
                              真实异常
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-[#6aa2ca] bg-[#ecf6ff] px-2 py-2 text-xs text-[#265579]"
                              onClick={() => setArchiveReview((prev) => ({ ...prev, [point.day]: false }))}
                            >
                              误报
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <p className="rounded-2xl border border-[#cfdeeb] bg-[#f5faff] p-4 text-sm text-[#3f5d77]">
                      复核进度：{reviewCount}/{monitor.length}，复核准确率：{score(reviewAccuracy)}
                    </p>
                  </>
                )}

                {quest === "archive" && step === 4 && (
                  <>
                    <p className="text-sm text-[#4a6279]">调整灵敏度与阈值宽度并运行 7 天模拟。</p>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={1}
                      value={archiveSensitivity}
                      onChange={(event) => setArchiveSensitivity(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-[#57708a]">灵敏度：{sensitivityText(archiveSensitivity)}</p>
                    <input
                      type="range"
                      min={0.7}
                      max={1.5}
                      step={0.1}
                      value={archiveSigmaScale}
                      onChange={(event) => setArchiveSigmaScale(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-[#57708a]">阈值宽度倍率：x{archiveSigmaScale.toFixed(1)}</p>
                    <button
                      type="button"
                      className="rounded-xl bg-[#1f7db8] px-4 py-3 text-sm font-semibold text-white"
                      onClick={simulateArchive}
                    >
                      运行模拟
                    </button>
                    {archiveResult && (
                      <p className="rounded-2xl border border-[#c8dcef] bg-[#f1f8ff] p-4 text-sm text-[#37566f]">
                        误报 {archiveResult.falseAlarm} 次，漏报 {archiveResult.miss} 次
                      </p>
                    )}
                  </>
                )}
              </main>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="rounded-xl border border-[#cddbd3] bg-[rgba(255,255,255,0.85)] px-4 py-2 text-sm text-[#3f5c4d]"
                onClick={previousStep}
              >
                {step === 0 ? "返回关卡选择" : "上一步"}
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#1f8a5b] px-5 py-2 text-sm font-semibold text-white disabled:bg-[#9abda9]"
                disabled={!canNext}
                onClick={nextStep}
              >
                {step === steps.length - 1 ? "完成关卡" : "下一步"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
