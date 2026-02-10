"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FARM_STEPS,
  FIELD_A_SAMPLES,
  FIELD_B_SAMPLES,
  FIELD_C_SAMPLES,
  SECOND_FIELD_TARGET,
  THIRD_FIELD_TARGET,
  TRAINING_POOL_SIZE,
  TRAINING_TARGET,
} from "@/lib/farm/datasets";
import { toConfusionMetrics } from "@/lib/farm/confusion";
import {
  buildPredictions,
  calculateFinalScore,
  calculateSecondFieldAccuracy,
  calculateStep2Errors,
  calculateStep2Score,
  calculateStep4CorrectCount,
  calculateStep4Score,
  calculateTrainingSetQuality,
  countLabeledSamples,
  generateLossSeries,
  toPercent,
} from "@/lib/farm/scoring";
import type { FinalSimulationResult, ModelJudgment, RiceLabel } from "@/lib/farm/types";
import AssistantNarrator from "@/components/AssistantNarrator";
import StepCollect from "./steps/StepCollect";
import StepCorrect from "./steps/StepCorrect";
import StepLabel from "./steps/StepLabel";
import StepTrainTest from "./steps/StepTrainTest";
import StepTuneFinal from "./steps/StepTuneFinal";

const FarmQuestScene3D = dynamic(() => import("./FarmQuestScene3D"), {
  ssr: false,
});

interface FarmQuestProps {
  playerName: string;
  playerStyle: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function FarmQuest({ playerName, playerStyle, onBack, onComplete }: FarmQuestProps) {
  const [step, setStep] = useState(0);

  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, RiceLabel>>({});
  const [activeSampleId, setActiveSampleId] = useState<string | null>(FIELD_A_SAMPLES[0]?.id ?? null);
  const [hoveredSampleId, setHoveredSampleId] = useState<string | null>(null);
  const [collectMessage, setCollectMessage] = useState("");

  const [trainProgress, setTrainProgress] = useState(0);
  const [fieldBReviews, setFieldBReviews] = useState<Record<string, ModelJudgment>>({});

  const [dataAugment, setDataAugment] = useState(false);
  const [layers, setLayers] = useState(3);
  const [learningRate, setLearningRate] = useState(5);
  const [finalResult, setFinalResult] = useState<FinalSimulationResult | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [adviceModeByStep, setAdviceModeByStep] = useState<Record<number, "explore" | "guided">>({});
  const [adviceRevealCountByStep, setAdviceRevealCountByStep] = useState<Record<number, number>>({});
  const [showDetailByStep, setShowDetailByStep] = useState<Record<number, boolean>>({});

  const [liteMode, setLiteMode] = useState(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Keep detailed 3D enabled for most student devices; only force lite mode on very low-core hardware.
    const lowCoreDevice = typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 2;

    const frame = window.requestAnimationFrame(() => {
      setLiteMode(reducedMotion || lowCoreDevice);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
    };
  }, []);

  const trainingSamples = useMemo(
    () => FIELD_A_SAMPLES.filter((sample) => collectedIds.includes(sample.id)),
    [collectedIds],
  );

  const hoveredSample = useMemo(
    () => [...FIELD_A_SAMPLES, ...FIELD_B_SAMPLES, ...FIELD_C_SAMPLES].find((item) => item.id === hoveredSampleId) ?? null,
    [hoveredSampleId],
  );

  const labeledCount = useMemo(() => countLabeledSamples(labels, trainingSamples), [labels, trainingSamples]);
  const step2Score = useMemo(() => calculateStep2Score(labels, trainingSamples), [labels, trainingSamples]);
  const step2Errors = useMemo(() => calculateStep2Errors(labels, trainingSamples), [labels, trainingSamples]);
  const trainingQuality = useMemo(
    () => calculateTrainingSetQuality(trainingSamples).quality,
    [trainingSamples],
  );

  const secondFieldTargetAccuracy = useMemo(
    () => calculateSecondFieldAccuracy(step2Score, trainingQuality),
    [step2Score, trainingQuality],
  );

  const fieldBPredictions = useMemo(
    () => buildPredictions(FIELD_B_SAMPLES, secondFieldTargetAccuracy, 19),
    [secondFieldTargetAccuracy],
  );

  const fieldBConfusion = useMemo(() => toConfusionMetrics(fieldBPredictions), [fieldBPredictions]);

  const reviewedCount = useMemo(() => Object.keys(fieldBReviews).length, [fieldBReviews]);
  const step4Score = useMemo(
    () => calculateStep4Score(fieldBReviews, fieldBPredictions),
    [fieldBPredictions, fieldBReviews],
  );
  const step4CorrectCount = useMemo(
    () => calculateStep4CorrectCount(fieldBReviews, fieldBPredictions),
    [fieldBPredictions, fieldBReviews],
  );

  useEffect(() => {
    if (step !== 2 || trainProgress >= 100) {
      return;
    }

    const timer = setInterval(() => {
      setTrainProgress((current) => Math.min(100, current + 8));
    }, 380);

    return () => clearInterval(timer);
  }, [step, trainProgress]);

  const effectiveActiveSampleId = useMemo(() => {
    if (step !== 1) {
      return activeSampleId;
    }

    if (trainingSamples.length === 0) {
      return null;
    }

    const stillExists =
      activeSampleId !== null && trainingSamples.some((sample) => sample.id === activeSampleId);
    if (stillExists) {
      return activeSampleId;
    }

    const nextUnlabeled = trainingSamples.find((sample) => labels[sample.id] === undefined);
    return nextUnlabeled?.id ?? trainingSamples[0].id;
  }, [step, trainingSamples, activeSampleId, labels]);

  const canNext = useMemo(() => {
    if (step === 0) {
      return collectedIds.length >= TRAINING_TARGET;
    }
    if (step === 1) {
      return trainingSamples.length === TRAINING_TARGET && labeledCount >= trainingSamples.length;
    }
    if (step === 2) {
      return trainProgress >= 100;
    }
    if (step === 3) {
      return reviewedCount >= SECOND_FIELD_TARGET;
    }
    return finalResult !== null;
  }, [
    step,
    collectedIds.length,
    trainingSamples.length,
    labeledCount,
    trainProgress,
    reviewedCount,
    finalResult,
  ]);

  function resetQuest() {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setStep(0);
    setCollectedIds([]);
    setLabels({});
    setActiveSampleId(FIELD_A_SAMPLES[0]?.id ?? null);
    setHoveredSampleId(null);
    setCollectMessage("");
    setTrainProgress(0);
    setFieldBReviews({});
    setDataAugment(false);
    setLayers(3);
    setLearningRate(5);
    setFinalResult(null);
    setTaskPanelOpen(false);
    setAdviceModeByStep({});
    setAdviceRevealCountByStep({});
    setShowDetailByStep({});
  }

  function toggleCollect(sampleId: string) {
    setCollectedIds((previous) => {
      const exists = previous.includes(sampleId);
      if (!exists && previous.length >= TRAINING_TARGET) {
        setCollectMessage("训练集已满 10 个，请先移除一个样本再添加新的。");
        return previous;
      }

      const next = exists ? previous.filter((id) => id !== sampleId) : [...previous, sampleId];

      setLabels((current) => {
        const filtered = Object.fromEntries(
          Object.entries(current).filter(([id]) => next.includes(id)),
        ) as Record<string, RiceLabel>;
        return filtered;
      });

      setCollectMessage(exists ? "已从训练集中移除该样本。" : "已加入训练集。");
      return next;
    });
    handleHoverSample(sampleId);
  }

  function markLabel(sampleId: string, label: RiceLabel) {
    setLabels((previous) => {
      const updated = { ...previous, [sampleId]: label };
      const nextUnlabeled = trainingSamples.find((sample) => updated[sample.id] === undefined);
      setActiveSampleId(nextUnlabeled?.id ?? sampleId);
      return updated;
    });
  }

  function handleSceneSelect(sampleId: string) {
    if (step === 0 && FIELD_A_SAMPLES.some((sample) => sample.id === sampleId)) {
      toggleCollect(sampleId);
      return;
    }

    if (step === 1 && trainingSamples.some((sample) => sample.id === sampleId)) {
      setActiveSampleId(sampleId);
      return;
    }

    setActiveSampleId(sampleId);
  }

  function handleHoverSample(sampleId: string | null) {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }

    if (sampleId === null) {
      hoverLeaveTimerRef.current = setTimeout(() => {
        setHoveredSampleId(null);
      }, 180);
      return;
    }

    setHoveredSampleId((current) => (current === sampleId ? current : sampleId));
  }

  function runFinalSimulation() {
    const score = calculateFinalScore({
      step2Score,
      step4Score,
      trainingSetQuality: trainingQuality,
      secondFieldAccuracy: fieldBConfusion.accuracy,
      params: {
        dataAugment,
        layers,
        learningRate,
      },
    });

    const thirdFieldPredictions = buildPredictions(FIELD_C_SAMPLES, score.finalAccuracy, 37);
    const thirdFieldConfusion = toConfusionMetrics(thirdFieldPredictions);
    const lossPoints = generateLossSeries({
      step2Score,
      step4Score,
      trainingSetQuality: trainingQuality,
      finalScore: score,
    });

    setFinalResult({
      score,
      lossPoints,
      thirdFieldPredictions,
      thirdFieldConfusion,
    });
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

    if (step === FARM_STEPS.length - 1) {
      onComplete();
      return;
    }

    setStep((current) => current + 1);
  }

  const progress = ((step + 1) / FARM_STEPS.length) * 100;
  const isLabelStep = step === 1;
  const adviceMode = adviceModeByStep[step] ?? "explore";
  const revealedAdviceCount = adviceRevealCountByStep[step] ?? 0;
  const showDetail = showDetailByStep[step] ?? false;

  const assistantLesson =
    step === 0
      ? `这一步像先挑教材：样本要覆盖不同情况，模型才不会“偏科”。你已收集 ${collectedIds.length}/${TRAINING_TARGET}，当前训练集质量 ${toPercent(trainingQuality)}。`
      : step === 1
        ? `打标签就像给练习题写标准答案。答案越准，模型学得越稳。你已完成 ${labeledCount}/${trainingSamples.length || TRAINING_TARGET} 个标签。`
        : step === 2
          ? trainProgress >= 100
            ? `训练结束了。把它当作带新巡田员实战演练：先学教材，再去第二块田判断。当前准确率 ${toPercent(fieldBConfusion.accuracy)}。`
            : `模型训练中（${trainProgress}%）。这一步像让新巡田员反复看案例，先形成“健康/异常”的判断边界。`
          : step === 3
            ? `纠错像老师批改作业：把错题讲明白，模型才会进步。你已纠错 ${reviewedCount}/${SECOND_FIELD_TARGET}。`
            : finalResult
            ? `调参像掌火候：火太大或太小都不行。你已经把最终准确率稳定在 ${toPercent(finalResult.score.finalAccuracy)}。`
              : "现在在调“火候”：层数、学习率、数据增强要平衡，目标是让第三块田泛化表现更稳。";

  const assistantHints = useMemo(
    () => [
      [
        `先在第一块田收集 ${TRAINING_TARGET} 个样本，优先覆盖“看起来明显不同”的稻种。`,
        "如果训练集里全是健康或全是不健康，模型会偏科，尽量混合采样。",
        "悬浮查看特征后再决定是否加入训练集，避免凭直觉乱收。",
      ],
      [
        "先看图片，再看文字特征，最后再点“健康/不健康”。",
        "优先处理你最确定的样本，再回头处理犹豫样本。",
        "当前样本都标完后，再进入下一步训练，避免把噪声标签喂给模型。",
      ],
      [
        "训练中先观察进度条，不需要频繁切换设置。",
        "训练完成后重点看第二块田准确率，决定后续纠错压力。",
        `若准确率偏低，通常和第二步标签质量相关。当前标签得分 ${toPercent(step2Score)}。`,
      ],
      [
        "把第二块田当成错题本：先改最明显的错判。",
        `目标是完成 ${SECOND_FIELD_TARGET} 条复核，数量和质量都重要。`,
        "纠错后再去调参，避免把参数问题和标签问题混在一起。",
      ],
      [
        "调参只改一两个变量，便于观察因果变化。",
        "层数太少学不动，太多会变慢；学习率太大容易震荡。",
        "先跑一次基线，再开数据增强对比第三块田表现。",
      ],
    ],
    [step2Score],
  );
  const currentHints = assistantHints[step] ?? [];
  const allHintsShown = currentHints.length > 0 && revealedAdviceCount >= currentHints.length;

  function setAdviceMode(mode: "explore" | "guided") {
    setAdviceModeByStep((previous) => ({ ...previous, [step]: mode }));
  }

  function revealNextAdvice() {
    const maxCount = currentHints.length;
    setAdviceModeByStep((previous) => ({ ...previous, [step]: "guided" }));
    setAdviceRevealCountByStep((previous) => ({
      ...previous,
      [step]: Math.min(maxCount, (previous[step] ?? 0) + 1),
    }));
  }

  function toggleDetailCard() {
    setShowDetailByStep((previous) => ({ ...previous, [step]: !showDetail }));
  }

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#0c1120]">
      <FarmQuestScene3D
        stepIndex={step}
        liteMode={liteMode}
        immersive
        className="absolute inset-0"
        showFieldBadges={false}
        showModeBadge={false}
        showHoverCard={false}
        fieldASamples={FIELD_A_SAMPLES}
        fieldBSamples={FIELD_B_SAMPLES}
        fieldCSamples={FIELD_C_SAMPLES}
        collectedIds={collectedIds}
        labels={labels}
        fieldBPredictions={fieldBPredictions}
        fieldBReviews={fieldBReviews}
        fieldCPredictions={finalResult?.thirdFieldPredictions ?? []}
        hoveredSampleId={hoveredSampleId}
        activeSampleId={effectiveActiveSampleId}
        onHoverSample={handleHoverSample}
        onSelectSample={handleSceneSelect}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(168,142,91,0.2),rgba(7,11,9,0.74)_76%)]" />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute left-3 top-3 w-[min(86vw,340px)] rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.74)] px-3 py-2 text-[#eaf0ff] backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9fb4e3]">Farm Quest</p>
          <p className="font-display mt-1 text-base">主题关卡1：保护我们的稻田</p>
          <p className="mt-1 text-[11px] text-[#a8b8dc]">
            第 {step + 1} 步 / 共 {FARM_STEPS.length} 步 · {FARM_STEPS[step]}
          </p>
          <p className="mt-1 text-[11px] text-[#b4c3e6]">
            {playerName}（{playerStyle}）
          </p>
        </div>

        {!isLabelStep && (
          <AssistantNarrator
            name={playerName}
            style={playerStyle}
            message={assistantLesson}
            theme="farm"
            className="pointer-events-auto absolute left-3 right-3 top-[146px] w-auto sm:right-[256px] sm:top-[124px] md:right-auto md:w-[min(46vw,420px)]"
          />
        )}

        <div className="pointer-events-auto absolute right-3 top-3 w-[min(64vw,220px)] rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.74)] p-2 text-[#e7eeff] backdrop-blur-md sm:w-[min(70vw,240px)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="rounded-full bg-[rgba(32,50,86,0.86)] px-2.5 py-1 text-[11px] text-[#d8e6ff]"
              onClick={() => setLiteMode((current) => !current)}
            >
              渲染：{liteMode ? "轻量" : "标准"}
            </button>
            <button
              type="button"
              className="rounded-full bg-[rgba(89,67,44,0.86)] px-2.5 py-1 text-[11px] text-[#ffe6c2]"
              onClick={resetQuest}
            >
              重置
            </button>
          </div>
          <div className="mt-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-[#7cb6ff] to-[#f0c97d]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-[#aebedf]">
            训练集 {TRAINING_TARGET} · 第二块田 {SECOND_FIELD_TARGET} · 第三块田 {THIRD_FIELD_TARGET}
          </p>
        </div>

        {hoveredSample && !isLabelStep && (
          <div className="pointer-events-auto absolute right-3 top-[104px] hidden w-[280px] rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.76)] px-3 py-2 text-[11px] text-[#d7e3ff] backdrop-blur md:block">
            <p className="font-semibold">{hoveredSample.name}</p>
            <p className="mt-1">叶子：{hoveredSample.profile.leaf}</p>
            <p>稻秆：{hoveredSample.profile.stem}</p>
            <p>小稻秆：{hoveredSample.profile.tiller}</p>
            <p>虫害：{hoveredSample.profile.pest}</p>
            <p>稻穗：{hoveredSample.profile.panicle}</p>
          </div>
        )}

        {!isLabelStep && (
          <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[min(38vw,460px)]">
            <div className="rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.78)] p-2 text-[#e7eeff] backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[rgba(255,255,255,0.16)] px-2.5 py-1 text-[11px] text-[#d8e4ff]">
                  {step + 1}/{FARM_STEPS.length}
                </span>
                <span className="text-[11px] text-[#a9badf]">{FARM_STEPS[step]}</span>
                <button
                  type="button"
                  className="ml-auto rounded-full bg-[rgba(255,255,255,0.16)] px-3 py-1 text-[11px] text-[#d8e4ff]"
                  onClick={() => setTaskPanelOpen((current) => !current)}
                >
                  {taskPanelOpen ? "收起建议" : "小麦建议"}
                </button>
              </div>

              {taskPanelOpen && (
                <div className="mt-2 space-y-2">
                  <div className="rounded-xl border border-[#d6dff4] bg-[rgba(245,248,255,0.96)] p-2 text-[#26334f]">
                    <p className="text-xs font-semibold text-[#2a4775]">小麦AI建议台</p>
                    <p className="mt-1 text-[11px] text-[#5f7298]">
                      你可以自主探索，也可以随时点“获取下一条建议”。
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          adviceMode === "explore"
                            ? "bg-[#dbe8ff] text-[#214274]"
                            : "bg-[rgba(255,255,255,0.7)] text-[#6b7ea2]"
                        }`}
                        onClick={() => setAdviceMode("explore")}
                      >
                        自主探索
                      </button>
                      <button
                        type="button"
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          adviceMode === "guided"
                            ? "bg-[#dbe8ff] text-[#214274]"
                            : "bg-[rgba(255,255,255,0.7)] text-[#6b7ea2]"
                        }`}
                        onClick={() => setAdviceMode("guided")}
                      >
                        建议模式
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-[#87b5ff] px-2.5 py-1 text-[11px] font-semibold text-[#0f2748] disabled:bg-[#c6d3ea] disabled:text-[#7b88a1]"
                        onClick={revealNextAdvice}
                        disabled={allHintsShown}
                      >
                        {allHintsShown ? "建议已看完" : "获取下一条建议"}
                      </button>
                    </div>

                    {adviceMode === "explore" && (
                      <p className="mt-2 rounded-lg bg-[#eef3ff] px-2 py-1.5 text-[11px] text-[#4f6690]">
                        当前为自主探索模式。你可以先自己尝试，卡住时再点“获取下一条建议”。
                      </p>
                    )}

                    {adviceMode === "guided" && (
                      <div className="mt-2 space-y-1.5">
                        {revealedAdviceCount === 0 ? (
                          <p className="rounded-lg bg-[#eef3ff] px-2 py-1.5 text-[11px] text-[#4f6690]">
                            还没有展示建议，点击“获取下一条建议”开始。
                          </p>
                        ) : (
                          currentHints.slice(0, revealedAdviceCount).map((hint, index) => (
                            <p
                              key={`${step}-hint-${index}`}
                              className="rounded-lg bg-[#eef3ff] px-2 py-1.5 text-[11px] text-[#415f91]"
                            >
                              建议 {index + 1}：{hint}
                            </p>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="rounded-full bg-[rgba(255,255,255,0.18)] px-3 py-1 text-[11px] text-[#d8e4ff]"
                    onClick={toggleDetailCard}
                  >
                    {showDetail ? "收起完整任务说明" : "查看完整任务说明（可选）"}
                  </button>

                  {showDetail && (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {FARM_STEPS.map((item, index) => (
                          <button
                            key={item}
                            type="button"
                            disabled={index > step}
                            onClick={() => index <= step && setStep(index)}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              index <= step
                                ? "bg-[#8ab8ff] text-[#0f203f]"
                                : "bg-[rgba(255,255,255,0.1)] text-[#97a9ce]"
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[42vh] overflow-auto rounded-xl border border-[#d6dff4] bg-[rgba(245,248,255,0.94)] p-2 text-[#26334f]">
                        {step === 0 && (
                          <StepCollect
                            collectedSamples={trainingSamples}
                            collectedIds={collectedIds}
                            target={TRAINING_TARGET}
                            poolSize={TRAINING_POOL_SIZE}
                            trainingQuality={trainingQuality}
                            hoveredSample={hoveredSample}
                            collectMessage={collectMessage}
                          />
                        )}

                        {step === 2 && (
                          <StepTrainTest
                            trainProgress={trainProgress}
                            step2Score={step2Score}
                            step2Errors={step2Errors}
                            trainingSetQuality={trainingQuality}
                            targetAccuracy={secondFieldTargetAccuracy}
                            predictions={fieldBPredictions}
                            confusion={fieldBConfusion}
                          />
                        )}

                        {step === 3 && (
                          <StepCorrect
                            predictions={fieldBPredictions}
                            reviews={fieldBReviews}
                            step4Score={step4Score}
                            correctCount={step4CorrectCount}
                            onReview={(sampleId, judgment) =>
                              setFieldBReviews((previous) => ({ ...previous, [sampleId]: judgment }))
                            }
                          />
                        )}

                        {step === 4 && (
                          <StepTuneFinal
                            dataAugment={dataAugment}
                            layers={layers}
                            learningRate={learningRate}
                            onDataAugmentChange={setDataAugment}
                            onLayersChange={setLayers}
                            onLearningRateChange={setLearningRate}
                            onRun={runFinalSimulation}
                            step2Score={step2Score}
                            step4Score={step4Score}
                            trainingSetQuality={trainingQuality}
                            finalResult={finalResult}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!isLabelStep && (
          <div className="pointer-events-auto absolute bottom-3 right-3 hidden w-[220px] rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.78)] p-2 text-[#e7eeff] backdrop-blur-xl sm:block">
            <button
              type="button"
              className="w-full rounded-full bg-[rgba(255,255,255,0.16)] px-4 py-2 text-[11px] text-[#d8e4ff]"
              onClick={previousStep}
            >
              {step === 0 ? "返回关卡选择" : "上一步"}
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-full bg-[#f0c27a] px-4 py-2 text-[11px] font-semibold text-[#2f230f] disabled:bg-[#5f6578] disabled:text-[#a6aec4]"
              disabled={!canNext}
              onClick={nextStep}
            >
              {step === FARM_STEPS.length - 1 ? "完成关卡" : "下一步"}
            </button>
          </div>
        )}

        {isLabelStep && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-3 top-[138px] z-30 flex justify-center px-3 sm:top-[142px] sm:px-6">
            <div className="flex h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-[#b8ccef] bg-[rgba(245,248,255,0.97)] shadow-[0_20px_40px_rgba(8,16,34,0.36)] backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2 border-b border-[#d1def4] bg-[rgba(236,243,255,0.86)] px-3 py-2.5 sm:px-4">
                <span className="rounded-full bg-[#d9e8ff] px-2.5 py-1 text-[11px] font-semibold text-[#345b92]">
                  {step + 1}/{FARM_STEPS.length}
                </span>
                <p className="text-[11px] text-[#4c6794]">第二步专注模式：请在中心工作台完成全部样本标注</p>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#bdcfee] bg-[#eef4ff] px-3 py-1.5 text-[11px] font-semibold text-[#3f618f]"
                    onClick={previousStep}
                  >
                    上一步
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#f0c27a] px-3 py-1.5 text-[11px] font-semibold text-[#2f230f] disabled:bg-[#a5b1c8] disabled:text-[#5f6a84]"
                    disabled={!canNext}
                    onClick={nextStep}
                  >
                    下一步
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-3 sm:p-4">
                <StepLabel
                  samples={trainingSamples}
                  labels={labels}
                  activeSampleId={effectiveActiveSampleId}
                  onFocusSample={setActiveSampleId}
                  onLabel={markLabel}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {!isLabelStep && (
        <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-30 sm:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.84)] p-2 backdrop-blur">
            <button
              type="button"
              className="rounded-full bg-[rgba(255,255,255,0.16)] px-4 py-2 text-xs text-[#d8e4ff]"
              onClick={previousStep}
            >
              {step === 0 ? "返回关卡选择" : "上一步"}
            </button>
            <button
              type="button"
              className="rounded-full bg-[#f0c27a] px-4 py-2 text-xs font-semibold text-[#2f230f] disabled:bg-[#5f6578] disabled:text-[#a6aec4]"
              disabled={!canNext}
              onClick={nextStep}
            >
              {step === FARM_STEPS.length - 1 ? "完成关卡" : "下一步"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
