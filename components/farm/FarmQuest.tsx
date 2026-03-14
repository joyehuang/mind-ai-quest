"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FARM_STEPS,
  FIELD_A_SAMPLES,
  FIELD_B_SAMPLES,
  FIELD_C_SAMPLES,
  SECOND_FIELD_TARGET,
  THIRD_FIELD_TARGET,
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
} from "@/lib/farm/scoring";
import type { FinalSimulationResult, ModelJudgment, RiceLabel } from "@/lib/farm/types";
import AssistantNarrator from "@/components/AssistantNarrator";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";
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
  onComplete: (summary: { answerRate: number; completedAt: string }) => void;
}

const FARM_ASSISTANT_MESSAGES = {
  collect: "现在你需要从练习田里收集稻子样本，这些是教小麦认识健康/不健康稻子的教材，是训练AI模型所必需的练习题。点击稻子即可收集，一共需要10株！",
  collectReady: "太棒了！10株教材都收集好了！点击右下角的「下一步」按钮继续吧！",
  label: "现在给收集来的教材贴上答案。告诉小麦哪些稻子是健康的、哪些是不健康的，这样小麦才能学习它们的区别。就像老师给学生批改作业一样！",
  labelReady: "完美！所有贴纸都贴好了！点击右上角的「下一步」按钮继续吧！",
  trained: `小麦正在复习练习田的教材，学习分辨稻子健康与否。复习结束后，它会去测验田尝试分辨新的稻子——就像你学完课后做小测验一样！`,
  correct: `来看看小麦在测验田的表现吧！当小麦猜错时，请你帮忙纠正它。你的每一次纠正，都会让小麦的判断变得更准确。`,
  tune: "最后，让小麦参加考试田的毕业考试！考试田的稻子是小麦从来没见过的，这是检验它真正学会没有的终极测试。你可以给小麦加一些技能来提高成绩哦！",
  complete: "太厉害了！我现在能更好地分辨稻子的好坏啦！",
  tuneHints: {
    augment: "这个技能可以让小麦把同一张图翻转、放大、变色再多看几遍，记得更牢哦！",
    layers: "这个技能代表了小麦脑子的层数，建议选择3层哦。太少了小麦会想得太简单，太多了反而会把自己绕晕",
    learningRate:
      "这个技能决定了小麦的学习速度，5是最好的，太小容易学不会，太大的话容易跳过正确答案哦！",
  },
} as const;

type FarmAssistantHintKey = keyof typeof FARM_ASSISTANT_MESSAGES.tuneHints;

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
  const [assistantOverride, setAssistantOverride] = useState<string | null>(null);
  const [activeTuneHint, setActiveTuneHint] = useState<FarmAssistantHintKey | null>(null);

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
    setAssistantOverride(null);
    setActiveTuneHint(null);
  }

  function toggleCollect(sampleId: string) {
    setCollectedIds((previous) => {
      const exists = previous.includes(sampleId);
      if (!exists && previous.length >= TRAINING_TARGET) {
        setCollectMessage("教材篮已经装满 10 株了，请先放回一株再挑新的。");
        return previous;
      }

      const next = exists ? previous.filter((id) => id !== sampleId) : [...previous, sampleId];

      setLabels((current) => {
        const filtered = Object.fromEntries(
          Object.entries(current).filter(([id]) => next.includes(id)),
        ) as Record<string, RiceLabel>;
        return filtered;
      });

      setCollectMessage(exists ? "已把这株稻子放回教材篮。" : "已把这株稻子放进教材篮。");
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
    setAssistantOverride(null);
    setActiveTuneHint(null);

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

    setFinalResult({
      score,
      thirdFieldPredictions,
      thirdFieldConfusion,
    });
  }

  function previousStep() {
    if (step === 0) {
      onBack();
      return;
    }

    setAssistantOverride(null);
    setActiveTuneHint(null);
    setStep((current) => Math.max(0, current - 1));
  }

  function nextStep() {
    if (!canNext) {
      return;
    }

    if (step === FARM_STEPS.length - 1) {
      onComplete({
        answerRate: finalResult?.score.finalAccuracy ?? 0,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    setAssistantOverride(null);
    setActiveTuneHint(null);
    setStep((current) => current + 1);
  }

  const progress = ((step + 1) / FARM_STEPS.length) * 100;
  const isLabelStep = step === 1;
  const isTrainStep = step === 2;
  const isCorrectionStep = step === 3;
  const isTuneStep = step === 4;
  const isCenterWorkbenchStep = isLabelStep || isTrainStep || isCorrectionStep || isTuneStep;
  const baseAssistantMessage = useMemo(() => {
    if (step === 0) {
      return canNext ? FARM_ASSISTANT_MESSAGES.collectReady : FARM_ASSISTANT_MESSAGES.collect;
    }
    if (step === 1) {
      return canNext ? FARM_ASSISTANT_MESSAGES.labelReady : FARM_ASSISTANT_MESSAGES.label;
    }
    if (step === 2) {
      return trainProgress >= 100 ? FARM_ASSISTANT_MESSAGES.trained : null;
    }
    if (step === 3) {
      return FARM_ASSISTANT_MESSAGES.correct;
    }
    return finalResult ? FARM_ASSISTANT_MESSAGES.complete : FARM_ASSISTANT_MESSAGES.tune;
  }, [canNext, finalResult, step, trainProgress]);
  const assistantMessage = assistantOverride ?? baseAssistantMessage;

  function handleTuneHintSelect(hint: FarmAssistantHintKey) {
    setActiveTuneHint(hint);
    setAssistantOverride(FARM_ASSISTANT_MESSAGES.tuneHints[hint]);
  }

  function renderAssistantBubble(className?: string) {
    if (!assistantMessage) {
      return null;
    }

    return (
      <AssistantNarrator
        name={playerName}
        style={playerStyle}
        message={assistantMessage}
        theme="farm"
        className={className}
      />
    );
  }

  function renderWorkbenchStage(title: string, children: ReactNode, contentClassName = "min-h-0 flex-1 overflow-auto p-3 sm:p-4") {
    return (
      <div className="pointer-events-auto absolute inset-x-0 bottom-3 top-[138px] z-30 flex justify-center px-3 sm:top-[142px] sm:px-6">
        <div className="flex h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-[#b8ccef] bg-[rgba(245,248,255,0.97)] shadow-[0_20px_40px_rgba(8,16,34,0.36)] backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#d1def4] bg-[rgba(236,243,255,0.86)] px-3 py-2.5 sm:px-4">
            <span className="rounded-full bg-[#d9e8ff] px-2.5 py-1 text-[11px] font-semibold text-[#345b92]">
              {step + 1}/{FARM_STEPS.length}
            </span>
            <p className="text-[11px] text-[#4c6794]">{title}</p>
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
                {step === FARM_STEPS.length - 1 ? "完成关卡，查看彩蛋" : "下一步"}
              </button>
            </div>
          </div>

          {assistantMessage && (
            <div className="border-b border-[#dbe5f5] bg-[linear-gradient(180deg,rgba(255,249,238,0.96),rgba(245,248,255,0.92))] px-3 py-3 sm:px-4">
              {renderAssistantBubble("w-full max-w-[760px]")}
            </div>
          )}

          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    );
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
        <div className="pointer-events-auto absolute left-3 top-3 w-[min(86vw,340px)] scale-[1.2] origin-top-left rounded-2xl border border-[#ffd700] bg-[rgba(255,255,240,0.98)] px-3 py-2 text-[#4a3728] backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b6914]">Farm Quest</p>
          <p className="font-display mt-1 text-base">主题关卡1：保护我们的稻田</p>
          <p className="mt-1 text-[11px] text-[#7a5a1f]">
            第 {step + 1} 步 / 共 {FARM_STEPS.length} 步 · {FARM_STEPS[step]}
          </p>
          <p className="mt-1 text-[11px] text-[#7a5a1f]">
            {playerName}（{playerStyle}）
          </p>
          {step === 0 && (
            <>
              <div className="mt-2 overflow-hidden rounded-full bg-[rgba(255,215,0,0.2)]">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-[#ffd700] to-[#ffed4e]"
                  style={{ width: `${Math.min((collectedIds.length / TRAINING_TARGET) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#7a5a1f]">
                教材进度：{collectedIds.length}/{TRAINING_TARGET}
              </p>
              {collectMessage && <p className="mt-1 text-[10px] text-[#8b6914]">{collectMessage}</p>}
            </>
          )}
        </div>

        {!isCenterWorkbenchStep && (
          <div className="pointer-events-auto fixed bottom-20 left-3 right-3 z-30 sm:absolute sm:bottom-auto sm:left-3 sm:right-[292px] sm:top-[240px] sm:z-auto md:right-auto animate-[slideUp_0.5s_ease-out]">
            {renderAssistantBubble("w-full sm:w-[min(50vw,500px)]")}
          </div>
        )}

        {!isCenterWorkbenchStep && (
          <div className="pointer-events-auto absolute bottom-3 right-3 hidden scale-[2] origin-bottom-right w-[220px] rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.78)] p-2 text-[#e7eeff] backdrop-blur-xl sm:block">
            <button
              type="button"
              className="w-full rounded-full bg-[rgba(255,255,255,0.16)] px-4 py-2 text-[11px] text-[#d8e4ff]"
              onClick={previousStep}
            >
              {step === 0 ? "返回首页" : "上一步"}
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-full bg-[#f0c27a] px-4 py-2 text-[11px] font-semibold text-[#2f230f] disabled:bg-[#5f6578] disabled:text-[#a6aec4]"
              disabled={!canNext}
              onClick={nextStep}
            >
              {step === FARM_STEPS.length - 1 ? "完成关卡，查看彩蛋" : "下一步"}
            </button>
          </div>
        )}

        {isLabelStep &&
          renderWorkbenchStage(
            "第二步专注模式：请在中心工作台给教材贴上答案标签",
            <StepLabel
              samples={trainingSamples}
              labels={labels}
              activeSampleId={effectiveActiveSampleId}
              onFocusSample={setActiveSampleId}
              onLabel={markLabel}
              className="h-full"
            />,
            "min-h-0 flex-1 overflow-auto p-3 sm:p-4",
          )}

        {isTrainStep &&
          renderWorkbenchStage(
            "第三步专注模式：请在中心工作台看小麦复习，并参加测验",
            <StepTrainTest
              trainProgress={trainProgress}
              step2Score={step2Score}
              step2Errors={step2Errors}
              trainingSetQuality={trainingQuality}
              targetAccuracy={secondFieldTargetAccuracy}
              predictions={fieldBPredictions}
              confusion={fieldBConfusion}
            />,
          )}

        {isCorrectionStep &&
          renderWorkbenchStage(
            "第四步专注模式：请在中心工作台检查小麦的测验答案",
            <StepCorrect
              predictions={fieldBPredictions}
              reviews={fieldBReviews}
              step4Score={step4Score}
              correctCount={step4CorrectCount}
              onReview={(sampleId, judgment) =>
                setFieldBReviews((previous) => ({ ...previous, [sampleId]: judgment }))
              }
            />,
          )}

        {isTuneStep &&
          renderWorkbenchStage(
            "第五步专注模式：请在中心工作台给小麦加技能，并参加考试田毕业考",
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
              activeHint={activeTuneHint}
              onExplain={handleTuneHintSelect}
            />,
          )}
      </div>

      {!isCenterWorkbenchStep && (
        <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-30 sm:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#4b5d86] bg-[rgba(11,17,34,0.84)] p-2 backdrop-blur">
            <button
              type="button"
              className="rounded-full bg-[rgba(255,255,255,0.16)] px-4 py-2 text-xs text-[#d8e4ff]"
              onClick={previousStep}
            >
              {step === 0 ? "返回首页" : "上一步"}
            </button>
            <button
              type="button"
              className="rounded-full bg-[#f0c27a] px-4 py-2 text-xs font-semibold text-[#2f230f] disabled:bg-[#5f6578] disabled:text-[#a6aec4]"
              disabled={!canNext}
              onClick={nextStep}
            >
              {step === FARM_STEPS.length - 1 ? "完成关卡，查看彩蛋" : "下一步"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
