"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AssistantNarrator from "@/components/AssistantNarrator";
import {
  WENSHUGE_FEATURES,
  WENSHUGE_TRAIN_RECORDS,
} from "@/lib/wenshuge/datasets";
import { runWenshugeSimulation, toPercent } from "@/lib/wenshuge/scoring";
import type {
  DetectionLabel,
  WenshugeFeatureDefinition,
  WenshugeFeatureKey,
} from "@/lib/wenshuge/types";

const WenshugeQuestScene3D = dynamic(
  () => import("./WenshugeQuestScene3D"),
  { ssr: false },
);

const STEPS = [
  "原始数据筛选特征",
  "数据预处理",
  "无监督学习训练",
  "阈值调优",
  "测试集评估",
  "人工复核纠错",
  "成功结算",
] as const;

const ALL_FEATURE_KEYS = WENSHUGE_FEATURES.map((item) => item.key);
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

interface WenshugeQuestProps {
  playerName: string;
  playerStyle: string;
  onBack: () => void;
  onComplete: () => void;
}

function formatFeatureValue(feature: WenshugeFeatureDefinition, value: number) {
  if (feature.key === "weekdayIndex") {
    return `周${WEEKDAY_LABELS[Math.round(value) - 1] ?? Math.round(value)}`;
  }
  if (feature.key === "festivalFlag") {
    return value >= 1 ? "是" : "否";
  }
  if (feature.key === "tiltAngle" || feature.key === "crackWidth") {
    return `${value.toFixed(2)}${feature.unit}`;
  }
  if (feature.key === "airTemperature" || feature.key === "wallWeathering") {
    return `${value.toFixed(1)}${feature.unit}`;
  }
  if (feature.key === "moistureLevel") {
    return value.toFixed(2);
  }
  return feature.unit ? `${Math.round(value)}${feature.unit}` : `${Math.round(value)}`;
}

export default function WenshugeQuest({
  playerName,
  playerStyle,
  onBack,
  onComplete,
}: WenshugeQuestProps) {
  const [step, setStep] = useState(0);
  const [selectedFeatureKeys, setSelectedFeatureKeys] =
    useState<WenshugeFeatureKey[]>(ALL_FEATURE_KEYS);
  const [hoveredFeatureKey, setHoveredFeatureKey] =
    useState<WenshugeFeatureKey | null>(null);

  const [standardize, setStandardize] = useState(true);
  const [dropSensorErrors, setDropSensorErrors] = useState(true);
  const [preprocessApplied, setPreprocessApplied] = useState(false);

  const [trainStarted, setTrainStarted] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);

  const [threshold, setThreshold] = useState(0.32);
  const [thresholdLocked, setThresholdLocked] = useState(false);

  const [manualLabels, setManualLabels] = useState<Record<number, DetectionLabel>>({});
  const [manualChecked, setManualChecked] = useState(false);
  const [manualPassed, setManualPassed] = useState(false);

  const [showRawData, setShowRawData] = useState(false);
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCoreDevice = typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 4;

    const frame = window.requestAnimationFrame(() => {
      setLiteMode(reducedMotion || lowCoreDevice);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const simulation = useMemo(
    () =>
      runWenshugeSimulation({
        selectedFeatureKeys,
        standardize,
        dropSensorErrors,
        threshold,
      }),
    [selectedFeatureKeys, standardize, dropSensorErrors, threshold],
  );

  const trainDone = trainProgress >= 100;
  const selectedFeatureSet = useMemo(
    () => new Set(selectedFeatureKeys),
    [selectedFeatureKeys],
  );
  const hoveredFeature = useMemo(
    () => WENSHUGE_FEATURES.find((item) => item.key === hoveredFeatureKey) ?? null,
    [hoveredFeatureKey],
  );

  useEffect(() => {
    if (step !== 2 || !trainStarted || trainDone) {
      return;
    }

    const timer = setInterval(() => {
      setTrainProgress((value) => Math.min(100, value + 8));
    }, 260);

    return () => clearInterval(timer);
  }, [step, trainStarted, trainDone]);

  const histogram = useMemo(() => {
    if (!simulation) {
      return [];
    }
    const bins = Array.from({ length: 8 }, (_, index) => ({
      start: index * 0.1,
      end: (index + 1) * 0.1,
      count: 0,
    }));
    for (const row of simulation.trainRows) {
      const bucket = Math.min(7, Math.floor(row.score / 0.1));
      bins[bucket].count += 1;
    }
    return bins;
  }, [simulation]);

  const histogramPeak = Math.max(1, ...histogram.map((item) => item.count));

  const selectedRelevantCount = useMemo(
    () => selectedFeatureKeys.filter((key) => WENSHUGE_FEATURES.find((item) => item.key === key)?.isRelevant).length,
    [selectedFeatureKeys],
  );
  const selectedIrrelevantCount = selectedFeatureKeys.length - selectedRelevantCount;

  const modelWrongCount = simulation
    ? simulation.testRows.filter((row) => row.predicted !== row.truth).length
    : 0;

  const manualRemainingWrong = simulation
    ? simulation.testRows.filter((row) => manualLabels[row.day] !== row.truth).length
    : 0;

  const manualCorrectionCount = simulation
    ? simulation.testRows.filter((row) => manualLabels[row.day] !== row.predicted).length
    : 0;

  const canNext =
    step === 0
      ? selectedFeatureKeys.length > 0
      : step === 1
        ? preprocessApplied
        : step === 2
          ? trainDone
          : step === 3
            ? thresholdLocked
            : step === 4
              ? simulation !== null
              : step === 5
                ? manualPassed
                : true;

  const progress = ((step + 1) / STEPS.length) * 100;

  const assistantLesson = useMemo(() => {
    if (step === 0) {
      return `先像医生问诊一样挑“有诊断价值”的指标。相关特征是体征，无关特征像背景噪音。当前你保留了相关 ${selectedRelevantCount} 项、无关 ${selectedIrrelevantCount} 项。`;
    }
    if (step === 1) {
      return "数据预处理像洗米淘沙：标准化是统一度量尺，剔除极端值是先去掉明显采集错误，避免模型把脏数据当规律。";
    }
    if (step === 2) {
      return `无监督训练像让新守阁人连续读值班日志：不先给答案，先记住“平时是什么样”。当前训练进度 ${trainProgress}%。`;
    }
    if (step === 3) {
      return `阈值像烟雾报警器灵敏度。阈值低会更敏感但可能误报，阈值高会更保守但可能漏报。你当前设定 ${threshold.toFixed(2)}。`;
    }
    if (step === 4) {
      return simulation
        ? `测试集像闭卷考：只看第21-30天，检验模型是否真学会。当前测试准确率 ${toPercent(simulation.testMetrics.accuracy)}，AUC ${toPercent(simulation.testMetrics.auc)}。`
        : "测试集像闭卷考：只看第21-30天，检验模型是否真学会。";
    }
    if (step === 5) {
      return `人工复核像师傅带徒弟复盘判例：把错判逐条纠正，模型才能知道哪里容易误判。当前还剩 ${manualRemainingWrong} 条需要修正。`;
    }
    return "你已经完成“模型初判 + 人工复核”的完整闭环，这正是文物异常监测最实用的工作流。";
  }, [
    step,
    selectedRelevantCount,
    selectedIrrelevantCount,
    trainProgress,
    threshold,
    simulation,
    manualRemainingWrong,
  ]);

  function resetDownstream() {
    setTrainStarted(false);
    setTrainProgress(0);
    setThresholdLocked(false);
    setManualLabels({});
    setManualChecked(false);
    setManualPassed(false);
  }

  function toggleFeature(key: WenshugeFeatureKey) {
    setSelectedFeatureKeys((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key],
    );
    setPreprocessApplied(false);
    resetDownstream();
  }

  function applyPreprocess() {
    setPreprocessApplied(true);
    resetDownstream();
  }

  function startTraining() {
    setTrainStarted(true);
    setTrainProgress(0);
    setThresholdLocked(false);
  }

  function lockThreshold() {
    setThresholdLocked(true);
    setManualLabels({});
    setManualChecked(false);
    setManualPassed(false);
  }

  function submitManualReview() {
    if (!simulation) {
      return;
    }

    setManualChecked(true);

    const allLabeled = simulation.testRows.every(
      (row) => manualLabels[row.day] !== undefined,
    );
    if (!allLabeled) {
      setManualPassed(false);
      return;
    }

    const remainingWrong = simulation.testRows.filter(
      (row) => manualLabels[row.day] !== row.truth,
    ).length;
    setManualPassed(remainingWrong === 0);
  }

  function previousStep() {
    if (step === 0) {
      onBack();
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  }

  function nextStep() {
    if (!canNext) {
      return;
    }
    if (step === STEPS.length - 1) {
      onComplete();
      return;
    }

    const targetStep = step + 1;
    if (targetStep === 5 && simulation && Object.keys(manualLabels).length === 0) {
      const initial: Record<number, DetectionLabel> = {};
      for (const row of simulation.testRows) {
        initial[row.day] = row.predicted;
      }
      setManualLabels(initial);
      setManualChecked(false);
      setManualPassed(false);
    }

    setStep(targetStep);
  }

  function resetQuest() {
    setStep(0);
    setSelectedFeatureKeys(ALL_FEATURE_KEYS);
    setHoveredFeatureKey(null);
    setStandardize(true);
    setDropSensorErrors(true);
    setPreprocessApplied(false);
    setTrainStarted(false);
    setTrainProgress(0);
    setThreshold(0.32);
    setThresholdLocked(false);
    setManualLabels({});
    setManualChecked(false);
    setManualPassed(false);
    setShowRawData(false);
  }

  return (
    <section className="relative min-h-[82vh] overflow-hidden rounded-[32px] border border-[#2a4a5f]">
      <WenshugeQuestScene3D
        stepIndex={step}
        liteMode={liteMode}
        selectedFeatureKeys={selectedFeatureKeys}
        threshold={threshold}
        trainProgress={trainProgress}
        testRows={simulation?.testRows ?? []}
        manualLabels={manualLabels}
        onHoverFeature={setHoveredFeatureKey}
        onToggleFeature={toggleFeature}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(60,128,162,0.24),rgba(7,18,28,0.86)_68%)]" />

      <header className="absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
        <div className="pointer-events-auto max-w-[620px] rounded-full bg-[rgba(8,24,38,0.66)] px-5 py-3 text-[#dff4ff] backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9bc8da]">Wenshuge Quest</p>
          <p className="font-display mt-1 text-lg">主题关卡2：文枢阁非监督学习小游戏（V1）</p>
          <p className="mt-1 text-xs text-[#8fb7c9]">
            第 {step + 1} 步 / 共 {STEPS.length} 步 · {STEPS[step]}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-[rgba(12,34,50,0.72)] px-3 py-1.5 text-xs text-[#c7e2ef] backdrop-blur"
            onClick={() => setLiteMode((current) => !current)}
          >
            渲染：{liteMode ? "轻量" : "标准"}
          </button>
          <button
            type="button"
            className="rounded-full bg-[rgba(12,34,50,0.72)] px-3 py-1.5 text-xs text-[#c7e2ef] backdrop-blur"
            onClick={() => setShowRawData(true)}
          >
            查看1-20天原始数据
          </button>
          <button
            type="button"
            className="rounded-full bg-[rgba(49,95,120,0.72)] px-3 py-1.5 text-xs text-[#def5ff] backdrop-blur"
            onClick={resetQuest}
          >
            重置关卡2
          </button>
        </div>
      </header>

      <div className="absolute left-4 top-24 z-20 max-w-[360px] space-y-2 text-[#d5edf8]">
        <p className="text-sm">
          伙伴：{playerName}（{playerStyle}）
        </p>
        <p className="text-xs text-[#93bbcc]">
          已选特征 {selectedFeatureKeys.length}/10 · 相关 {selectedRelevantCount} · 无关 {selectedIrrelevantCount}
        </p>
        {hoveredFeature && (
          <p className="text-xs text-[#b6d8e6]">
            场景传感器：{hoveredFeature.label} · {hoveredFeature.description}
          </p>
        )}
      </div>

      <AssistantNarrator
        name={playerName}
        style={playerStyle}
        message={assistantLesson}
        theme="wenshuge"
        className="absolute left-4 top-[178px] z-20 w-[min(88vw,360px)]"
      />

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl rounded-[28px] bg-[rgba(7,24,36,0.74)] p-4 text-[#e6f5ff] backdrop-blur-xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {STEPS.map((item, index) => (
              <button
                key={item}
                type="button"
                disabled={index > step}
                onClick={() => index <= step && setStep(index)}
                className={`rounded-full px-3 py-1 text-xs ${
                  index <= step
                    ? "bg-[#6cc4d8] text-[#062130]"
                    : "bg-[rgba(255,255,255,0.08)] text-[#87a8b6]"
                }`}
              >
                {index + 1}. {item}
              </button>
            ))}
            <div className="ml-auto w-[140px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#77d4e0] to-[#8de0a7]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="max-h-[42vh] overflow-y-auto pr-1">
            {step === 0 && (
              <div className="space-y-3 text-sm">
                <p>
                  第一步：点击 3D 场景里围绕古楼的传感器节点，或点击下方标签，筛选真正有用的特征。
                </p>
                <p className="text-xs text-[#9dc3d3]">
                  目标建议：总特征约 5 个，有效特征尽量保留，无关特征尽量移除。
                </p>
                <div className="flex flex-wrap gap-2">
                  {WENSHUGE_FEATURES.map((feature) => {
                    const selected = selectedFeatureSet.has(feature.key);
                    return (
                      <button
                        key={feature.key}
                        type="button"
                        onClick={() => toggleFeature(feature.key)}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          selected
                            ? "bg-[#8ce8cf] text-[#083125]"
                            : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                        }`}
                      >
                        {feature.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3 text-sm">
                <p>第二步：配置预处理策略。</p>
                <div className="space-y-2">
                  <p className="text-xs text-[#9ec4d3]">
                    标准化可消除尺度差异，比如“瓦片脱落数量”(0-10) 与 “倾斜角度”(0-2°)。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStandardize(true);
                        setPreprocessApplied(false);
                        resetDownstream();
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        standardize
                          ? "bg-[#7fd4eb] text-[#06263a]"
                          : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                      }`}
                    >
                      做标准化
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStandardize(false);
                        setPreprocessApplied(false);
                        resetDownstream();
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        !standardize
                          ? "bg-[#f0b27f] text-[#3c1b06]"
                          : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                      }`}
                    >
                      不做标准化
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[#9ec4d3]">
                    1-20 天中有部分采集错误值，剔除后模型更容易学到真实正常模式。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDropSensorErrors(true);
                        setPreprocessApplied(false);
                        resetDownstream();
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        dropSensorErrors
                          ? "bg-[#7fd4eb] text-[#06263a]"
                          : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                      }`}
                    >
                      剔除极端值
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDropSensorErrors(false);
                        setPreprocessApplied(false);
                        resetDownstream();
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        !dropSensorErrors
                          ? "bg-[#f0b27f] text-[#3c1b06]"
                          : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                      }`}
                    >
                      保留全部数据
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full bg-[#6cd3dd] px-4 py-2 text-xs font-semibold text-[#082535]"
                  onClick={applyPreprocess}
                >
                  点击执行数据预处理
                </button>
                {preprocessApplied && simulation && (
                  <p className="text-xs text-[#9fd5c8]">
                    预处理完成，可用于学习的参考天数：{simulation.trainingReferenceDays}/20。
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 text-sm">
                <p>第三步：基于第 1-20 天数据进行无监督学习。</p>
                <button
                  type="button"
                  className="rounded-full bg-[#6cd3dd] px-4 py-2 text-xs font-semibold text-[#082535]"
                  onClick={startTraining}
                >
                  开始无监督学习
                </button>
                <div className="overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#75d7e1] to-[#8ae3a6]"
                    style={{ width: `${Math.min(trainProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#9ec3d3]">训练进度：{trainProgress}%</p>
                {trainDone && simulation && (
                  <p className="text-xs text-[#9fd5c8]">
                    学习完成：训练准确率 {toPercent(simulation.trainMetrics.accuracy)}，训练 AUC{" "}
                    {toPercent(simulation.trainMetrics.auc)}，阶段质量分 {toPercent(simulation.qualityScore)}。
                  </p>
                )}
              </div>
            )}

            {step === 3 && simulation && (
              <div className="space-y-3 text-sm">
                <p>
                  第四步：阈值调优（0.20-0.50）。阈值越高，异常判定越少；阈值越低，异常判定越多。
                </p>
                <p className="text-xs text-[#b8d8e6]">当前阈值：{threshold.toFixed(2)}</p>
                <input
                  type="range"
                  min={0.2}
                  max={0.5}
                  step={0.01}
                  value={threshold}
                  onChange={(event) => {
                    setThreshold(Number(event.target.value));
                    setThresholdLocked(false);
                    setManualLabels({});
                    setManualChecked(false);
                    setManualPassed(false);
                  }}
                  className="w-full"
                />

                <div className="relative mt-2 h-24">
                  <div className="absolute inset-0 flex items-end gap-2">
                    {histogram.map((bin) => (
                      <div key={bin.start} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm bg-gradient-to-t from-[#65bfd0] to-[#9de6d3]"
                          style={{
                            height: `${Math.max(6, (bin.count / histogramPeak) * 100)}%`,
                          }}
                        />
                        <span className="text-[10px] text-[#8bb0bf]">{bin.start.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="absolute bottom-0 top-0 border-l-2 border-[#f29f63]"
                    style={{ left: `${(threshold / 0.8) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  className="rounded-full bg-[#6cd3dd] px-4 py-2 text-xs font-semibold text-[#082535]"
                  onClick={lockThreshold}
                >
                  锁定当前阈值
                </button>
              </div>
            )}

            {step === 4 && simulation && (
              <div className="space-y-3 text-sm">
                <p>第五步：在第 21-30 天测试集上输出模型表现。</p>
                <p className="text-xs text-[#9ec3d3]">
                  测试准确率 {toPercent(simulation.testMetrics.accuracy)} · 测试 AUC{" "}
                  {toPercent(simulation.testMetrics.auc)} · 误报 {simulation.testMetrics.fp} · 漏报{" "}
                  {simulation.testMetrics.fn}
                </p>
                <p className="text-xs text-[#9ec3d3]">
                  本轮筛选结果：相关特征 {simulation.selectedRelevant} 个，无关特征{" "}
                  {simulation.selectedIrrelevant} 个。
                </p>
                <div className="grid gap-1 text-xs text-[#c2ddea] sm:grid-cols-2">
                  {simulation.testRows.map((row) => (
                    <div key={row.day} className="flex items-center justify-between">
                      <span>第 {row.day} 天</span>
                      <span>
                        分数 {row.score.toFixed(3)} · {row.predicted === "anomaly" ? "异常" : "正常"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && simulation && (
              <div className="space-y-3 text-sm">
                <p>第六步：人工复核模型输出，把错判都改正。</p>
                <p className="text-xs text-[#9ec3d3]">
                  模型错判 {modelWrongCount} 条，你已人工修改 {manualCorrectionCount} 条。
                </p>
                <div className="space-y-2">
                  {simulation.testRows.map((row) => (
                    <div
                      key={row.day}
                      className="border-b border-[rgba(255,255,255,0.08)] pb-2"
                    >
                      <p className="text-xs text-[#c8e0ec]">
                        第 {row.day} 天 · 风化 {row.values.wallWeathering.toFixed(1)}% · 倾斜{" "}
                        {row.values.tiltAngle.toFixed(2)}° · 裂缝 {row.values.crackWidth.toFixed(2)}mm
                      </p>
                      <p className="text-xs text-[#9ec3d3]">
                        模型判断：{row.predicted === "anomaly" ? "异常值" : "正常值"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-[11px] ${
                            manualLabels[row.day] === "normal"
                              ? "bg-[#79d0e8] text-[#082536]"
                              : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                          }`}
                          onClick={() => {
                            setManualLabels((previous) => ({
                              ...previous,
                              [row.day]: "normal",
                            }));
                            setManualChecked(false);
                            setManualPassed(false);
                          }}
                        >
                          人工判为正常
                        </button>
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-[11px] ${
                            manualLabels[row.day] === "anomaly"
                              ? "bg-[#f0b07f] text-[#3c1b06]"
                              : "bg-[rgba(255,255,255,0.12)] text-[#a8c8d6]"
                          }`}
                          onClick={() => {
                            setManualLabels((previous) => ({
                              ...previous,
                              [row.day]: "anomaly",
                            }));
                            setManualChecked(false);
                            setManualPassed(false);
                          }}
                        >
                          人工判为异常
                        </button>
                      </div>
                      {manualChecked && (
                        <p
                          className={`mt-1 text-[11px] ${
                            manualLabels[row.day] === row.truth
                              ? "text-[#9be3af]"
                              : "text-[#ffbf97]"
                          }`}
                        >
                          专家结论：{row.truth === "anomaly" ? "异常值" : "正常值"}。
                          你的判定
                          {manualLabels[row.day] === row.truth ? "正确" : "需要修正"}。
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="rounded-full bg-[#6cd3dd] px-4 py-2 text-xs font-semibold text-[#082535]"
                  onClick={submitManualReview}
                >
                  提交人工复核
                </button>
                {manualChecked && (
                  <p
                    className={`text-xs ${
                      manualRemainingWrong === 0 ? "text-[#9be3af]" : "text-[#ffbf97]"
                    }`}
                  >
                    {manualRemainingWrong === 0
                      ? "人工复核通过：模型错判已全部修正。"
                      : `还有 ${manualRemainingWrong} 条需要继续修正。`}
                  </p>
                )}
              </div>
            )}

            {step === 6 && simulation && (
              <div className="space-y-2 text-sm">
                <p className="text-lg font-semibold text-[#9ce4af]">
                  成功！你已经把所有异常值都找出来啦
                </p>
                <p className="text-xs text-[#b6d5e2]">
                  模型阶段：准确率 {toPercent(simulation.testMetrics.accuracy)} · AUC{" "}
                  {toPercent(simulation.testMetrics.auc)} · 错判 {modelWrongCount} 条。
                </p>
                <p className="text-xs text-[#9ce4af]">
                  人工复核后：测试集 10/10 已确认正确。
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-full bg-[rgba(255,255,255,0.14)] px-4 py-2 text-xs text-[#cde3ee]"
              onClick={previousStep}
            >
              {step === 0 ? "返回关卡选择" : "上一步"}
            </button>
            <button
              type="button"
              className="rounded-full bg-[#83ded2] px-5 py-2 text-xs font-semibold text-[#082433] disabled:bg-[#5b7284] disabled:text-[#a3b8c5]"
              disabled={!canNext}
              onClick={nextStep}
            >
              {step === STEPS.length - 1 ? "完成关卡2" : "下一步"}
            </button>
          </div>
        </div>
      </div>

      {showRawData && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(2,9,16,0.82)] p-4 backdrop-blur-md">
          <div className="max-h-[78vh] w-full max-w-6xl overflow-auto rounded-3xl bg-[rgba(10,30,44,0.92)] p-4 text-[#e8f5ff]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">第 1-20 天原始观测数据</p>
              <button
                type="button"
                className="rounded-full bg-[rgba(255,255,255,0.16)] px-3 py-1 text-xs"
                onClick={() => setShowRawData(false)}
              >
                关闭
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.16)] text-[#9ec3d3]">
                    <th className="px-2 py-2">天数</th>
                    {WENSHUGE_FEATURES.map((feature) => (
                      <th key={feature.key} className="px-2 py-2">
                        {feature.label}
                      </th>
                    ))}
                    <th className="px-2 py-2">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {WENSHUGE_TRAIN_RECORDS.map((record) => (
                    <tr
                      key={record.day}
                      className="border-b border-[rgba(255,255,255,0.06)] text-[#d5e9f2]"
                    >
                      <td className="px-2 py-2 font-semibold">第 {record.day} 天</td>
                      {WENSHUGE_FEATURES.map((feature) => (
                        <td key={`${record.day}-${feature.key}`} className="px-2 py-2">
                          {formatFeatureValue(feature, record.values[feature.key])}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-[#a7c7d6]">{record.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
