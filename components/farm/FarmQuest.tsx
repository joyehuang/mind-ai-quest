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
import type { FarmSample, FinalSimulationResult, ModelJudgment, RiceLabel } from "@/lib/farm/types";
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

interface CollectPopupState {
  sample: FarmSample;
  action: "added" | "removed" | "full";
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
  const [collectPopup, setCollectPopup] = useState<CollectPopupState | null>(null);

  const [liteMode, setLiteMode] = useState(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
      if (collectPopupTimerRef.current) {
        clearTimeout(collectPopupTimerRef.current);
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
    if (collectPopupTimerRef.current) {
      clearTimeout(collectPopupTimerRef.current);
      collectPopupTimerRef.current = null;
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
    setCollectPopup(null);
  }

  function showCollectPopup(sampleId: string, action: CollectPopupState["action"]) {
    const sample = FIELD_A_SAMPLES.find((item) => item.id === sampleId);
    if (!sample) {
      return;
    }

    if (collectPopupTimerRef.current) {
      clearTimeout(collectPopupTimerRef.current);
      collectPopupTimerRef.current = null;
    }

    setCollectPopup({ sample, action });
    collectPopupTimerRef.current = setTimeout(() => {
      setCollectPopup(null);
    }, 2800);
  }

  function toggleCollect(sampleId: string) {
    setCollectedIds((previous) => {
      const exists = previous.includes(sampleId);
      if (!exists && previous.length >= TRAINING_TARGET) {
        setCollectMessage("训练集已满 10 个，请先移除一个样本再添加新的。");
        showCollectPopup(sampleId, "full");
        return previous;
      }

      const next = exists ? previous.filter((id) => id !== sampleId) : [...previous, sampleId];

      setLabels((current) => {
        const filtered = Object.fromEntries(
          Object.entries(current).filter(([id]) => next.includes(id)),
        ) as Record<string, RiceLabel>;
        return filtered;
      });

      setCollectMessage("");
      showCollectPopup(sampleId, exists ? "removed" : "added");
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

  const speech =
    step === 0
      ? `从 ${TRAINING_POOL_SIZE} 个候选里挑 ${TRAINING_TARGET} 个样本，当前训练集质量 ${toPercent(trainingQuality)}。`
      : step === 1
        ? `现在开始打标签。你已经标了 ${labeledCount}/${trainingSamples.length || TRAINING_TARGET} 个。`
        : step === 2
          ? trainProgress >= 100
            ? `第二块田测试完成，当前准确率 ${toPercent(fieldBConfusion.accuracy)}。`
            : "训练进行中，等进度到 100% 就能看到第二块田预测结果。"
          : step === 3
            ? `请判断模型预测对错。已纠错 ${reviewedCount}/${SECOND_FIELD_TARGET}。`
            : finalResult
              ? `第三块田最终准确率 ${toPercent(finalResult.score.finalAccuracy)}。`
              : "调节记忆药水、层数和学习速度，再运行最终测试。";

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#d6e5dc] bg-[rgba(255,255,255,0.92)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#214031]">主题关卡1：保护我们的稻田</h2>
          <span className="text-sm text-[#4f6659]">
            第 {step + 1} 步 / 共 {FARM_STEPS.length} 步
          </span>
        </div>

        <div className="mt-3 h-3 rounded-full bg-[#deebe4] p-[2px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2a8d5d] to-[#86d09f]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {FARM_STEPS.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`rounded-xl border px-2 py-2 text-xs ${
                index <= step
                  ? "border-[#8dbfa2] bg-[#eaf7ef] text-[#1f5f3e]"
                  : "border-[#d9e2dc] bg-[#f7faf8] text-[#60766a]"
              }`}
              disabled={index > step}
              onClick={() => index <= step && setStep(index)}
            >
              {index + 1}. {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[310px_1fr]">
        <aside className="rounded-3xl border border-[#d5e4dc] bg-[rgba(255,255,255,0.92)] p-5">
          <div className="rounded-2xl border border-[#cde0d3] bg-[#f4fbf7] p-4">
            <p className="text-xs text-[#587264]">AI 小助手</p>
            <p className="mt-1 text-lg font-semibold text-[#234534]">{playerName}</p>
            <p className="text-xs text-[#5a7366]">{playerStyle}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-[#d4e2db] bg-[#fafdfb] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6a7f73]">实时提示</p>
            <p className="mt-2 text-sm leading-6 text-[#2f4d3e]">{speech}</p>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              className="w-full rounded-xl border border-[#cfdcd4] bg-white px-3 py-2 text-sm text-[#3f5d4f]"
              onClick={() => setLiteMode((current) => !current)}
            >
              切换渲染模式：{liteMode ? "轻量" : "标准"}
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-[#cfdcd4] bg-white px-3 py-2 text-sm text-[#3f5d4f]"
              onClick={resetQuest}
            >
              重置关卡1
            </button>
          </div>
        </aside>

        <main className="space-y-4 rounded-3xl border border-[#d5e4dc] bg-[rgba(255,255,255,0.94)] p-5">
          <FarmQuestScene3D
            stepIndex={step}
            liteMode={liteMode}
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

          {step === 1 && (
            <StepLabel
              samples={trainingSamples}
              labels={labels}
              activeSampleId={effectiveActiveSampleId}
              onFocusSample={setActiveSampleId}
              onLabel={markLabel}
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
          {step === FARM_STEPS.length - 1 ? "完成关卡" : "下一步"}
        </button>
      </div>

      <p className="text-xs text-[#5d7368]">
        数据规模：第一块田候选 {TRAINING_POOL_SIZE}（训练集选取 {TRAINING_TARGET}），第二块田 {SECOND_FIELD_TARGET}，第三块田 {THIRD_FIELD_TARGET}。
      </p>

      {collectPopup && step === 0 && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#cde2d5] bg-[rgba(255,255,255,0.97)] p-4 shadow-[0_16px_38px_rgba(18,62,38,0.18)] backdrop-blur-sm">
          <p
            className={`text-sm font-semibold ${
              collectPopup.action === "added"
                ? "text-[#1f7a4d]"
                : collectPopup.action === "removed"
                  ? "text-[#8c4d2b]"
                  : "text-[#8a5b1f]"
            }`}
          >
            {collectPopup.action === "added" && "已加入训练集"}
            {collectPopup.action === "removed" && "已移出训练集"}
            {collectPopup.action === "full" && "训练集已满（10/10）"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#2e5342]">{collectPopup.sample.name}</p>
          <p className="mt-1 text-xs text-[#496356]">叶子：{collectPopup.sample.profile.leaf}</p>
          <p className="text-xs text-[#496356]">稻秆：{collectPopup.sample.profile.stem}</p>
          <p className="text-xs text-[#496356]">小稻秆：{collectPopup.sample.profile.tiller}</p>
          <p className="text-xs text-[#496356]">虫害：{collectPopup.sample.profile.pest}</p>
          <p className="text-xs text-[#496356]">稻穗：{collectPopup.sample.profile.panicle}</p>
        </div>
      )}
    </section>
  );
}
