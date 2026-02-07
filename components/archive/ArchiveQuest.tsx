"use client";

import { useEffect, useMemo, useState } from "react";
import { GameButton, GameProgress } from "@/components/ui/GameUI";
import {
  ARCHIVE_HISTORY,
  INTRO_SCENES,
  STEP1_GUIDE_LINES,
  STEP2_GUIDE_LINES,
  STEP4_GUIDE_LINES,
  STEP_TITLES,
  dayNarration,
} from "@/lib/archive/data";
import {
  calcBaselineStats,
  clampBaselineRange,
  formatPercent,
  runMonitorDetection,
  sensorRange,
} from "@/lib/archive/scoring";
import type {
  ArchiveStep,
  BaselineRange,
  DaySensorPoint,
  SensitivityLevel,
  Step1Record,
  Step2Record,
  Step4Record,
  Step5Record,
} from "@/lib/archive/types";

interface ArchiveQuestProps {
  playerName: string;
  playerStyle: string;
  onBack: () => void;
  onComplete: () => void;
}

type AlertReview = "anomaly" | "false_alarm";
type ModalKey = "step1" | "step2" | "step3" | "step4" | null;

const DEFAULT_BASELINE: BaselineRange = { start: 5, end: 12 };

const SENSOR_META = [
  { key: "tilt", label: "墙体倾斜角", color: "#23d7ff", unit: "°" },
  { key: "humidity", label: "湿度", color: "#37ff9a", unit: "%" },
  { key: "temperature", label: "温度", color: "#ffd166", unit: "℃" },
] as const;

const SENSITIVITY_OPTIONS: Array<{
  value: SensitivityLevel;
  label: string;
  subtitle: string;
}> = [
  { value: "relaxed", label: "宽松 ±3σ", subtitle: "少报警，可能漏报" },
  { value: "balanced", label: "平衡 ±2σ", subtitle: "推荐默认" },
  { value: "strict", label: "严格 ±1.5σ", subtitle: "多报警，更安全" },
];

const MODAL_CONTENT: Record<Exclude<ModalKey, null>, { title: string; body: string; button: string }> = {
  step1: {
    title: "小知识",
    body: "老房子不是“不变”才健康，而是“变化有规律”才正常。AI先学会正常，才能发现不正常。",
    button: "知道了",
  },
  step2: {
    title: "小知识",
    body: "你在做“建立基线”。AI先认识健康状态，就可以检测偏离，这就是异常检测。",
    button: "继续",
  },
  step3: {
    title: "小知识",
    body: "这不是分类任务，而是“找不同”。AI没学过全部病害，但它学会了正常节奏。",
    button: "知道了",
  },
  step4: {
    title: "小知识",
    body: "文物损伤千奇百怪，很难穷举标注。工程上常用“学正常、找异常”的方法。",
    button: "继续监测",
  },
};

const STEP_PROGRESS: Record<ArchiveStep, number> = {
  0: 20,
  1: 40,
  2: 60,
  3: 80,
  4: 100,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const STEP_DEFAULT_SECONDS: Record<ArchiveStep, number> = {
  0: 90,
  1: 120,
  2: 10,
  3: 140,
  4: 80,
};

function InfoModal({ type, onClose }: { type: Exclude<ModalKey, null>; onClose: () => void }) {
  return (
    <div className="fixed left-1/2 top-1/2 z-[9999] w-[min(92vw,430px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(84,224,255,0.52)] bg-[rgba(7,24,45,0.94)] p-4 shadow-[0_20px_42px_rgba(5,15,33,0.58)]">
      <p className="text-sm font-semibold text-[#d0f4ff]">{MODAL_CONTENT[type].title}</p>
      <p className="mt-2 text-sm leading-7 text-[#acdcef]">{MODAL_CONTENT[type].body}</p>
      <GameButton type="button" variant="primary" className="mt-3 px-3 py-2 text-xs" onClick={onClose}>
        {MODAL_CONTENT[type].button}
      </GameButton>
    </div>
  );
}

function SensorChart({
  points,
  selectedDay,
  viewedDays,
  baselineRange,
  onSelectDay,
}: {
  points: DaySensorPoint[];
  selectedDay: number;
  viewedDays: number[];
  baselineRange?: BaselineRange | null;
  onSelectDay: (day: number) => void;
}) {
  const width = 920;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 36, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const tiltRange = sensorRange(points, "tilt");
  const humidityRange = sensorRange(points, "humidity");
  const tempRange = sensorRange(points, "temperature");
  const viewedSet = new Set(viewedDays);

  function xOf(day: number) {
    return padding.left + ((day - 1) / Math.max(points.length - 1, 1)) * innerWidth;
  }

  function yOf(point: DaySensorPoint, key: "tilt" | "humidity" | "temperature") {
    const range = key === "tilt" ? tiltRange : key === "humidity" ? humidityRange : tempRange;
    const ratio = (point[key] - range.min) / range.spread;
    return padding.top + innerHeight - ratio * innerHeight;
  }

  function linePoints(key: "tilt" | "humidity" | "temperature") {
    return points.map((item) => `${xOf(item.day)},${yOf(item, key)}`).join(" ");
  }

  const selected = points.find((item) => item.day === selectedDay) ?? points[0];
  const rangeStart = baselineRange ? xOf(baselineRange.start) : null;
  const rangeEnd = baselineRange ? xOf(baselineRange.end) : null;

  return (
    <div className="rounded-2xl border border-[rgba(67,205,248,0.34)] bg-[rgba(7,24,45,0.84)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full rounded-xl bg-[#071a31]">
        <rect width={width} height={height} fill="#071a31" />

        {rangeStart !== null && rangeEnd !== null && (
          <rect
            x={Math.min(rangeStart, rangeEnd)}
            y={padding.top}
            width={Math.max(Math.abs(rangeEnd - rangeStart), 1)}
            height={innerHeight}
            fill="rgba(61,214,255,0.18)"
          />
        )}

        {Array.from({ length: 5 }).map((_, index) => {
          const y = padding.top + (innerHeight / 4) * index;
          return (
            <line
              key={`grid-${index}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + innerWidth}
              y2={y}
              stroke="rgba(87,177,220,0.32)"
              strokeWidth={1}
            />
          );
        })}

        {SENSOR_META.map((sensor) => (
          <polyline
            key={sensor.key}
            points={linePoints(sensor.key)}
            fill="none"
            stroke={sensor.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {points.map((point) => {
          const isSelected = point.day === selectedDay;
          return (
            <g key={`point-${point.day}`}>
              <circle
                cx={xOf(point.day)}
                cy={yOf(point, "tilt")}
                r={isSelected ? 6 : viewedSet.has(point.day) ? 4 : 3}
                fill={isSelected ? "#23d7ff" : viewedSet.has(point.day) ? "#37ff9a" : "#5f8fab"}
                stroke="#0a1f38"
                strokeWidth={isSelected ? 2 : 1}
                onClick={() => onSelectDay(point.day)}
                style={{ cursor: "pointer" }}
              />
              {(point.day % 5 === 0 || point.day === 1 || point.day === 30) && (
                <text x={xOf(point.day)} y={padding.top + innerHeight + 18} fontSize="11" textAnchor="middle" fill="#83c8e5">
                  {point.day}
                </text>
              )}
            </g>
          );
        })}

        <line
          x1={xOf(selected.day)}
          y1={padding.top}
          x2={xOf(selected.day)}
          y2={padding.top + innerHeight}
          stroke="#79cbe8"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
      </svg>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {SENSOR_META.map((sensor) => (
          <div key={sensor.key} className="rounded-xl border border-[rgba(63,168,214,0.36)] bg-[rgba(8,27,49,0.86)] px-3 py-2 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sensor.color }} />
            <span className="ml-2 font-medium text-[#c9efff]">{sensor.label}</span>
            <p className="mt-1 text-[#9bcee3]">
              第{selected.day}天：{selected[sensor.key]}
              {sensor.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArchiveQuest({ playerName, playerStyle, onBack, onComplete }: ArchiveQuestProps) {
  const [introDone, setIntroDone] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);

  const [step, setStep] = useState<ArchiveStep>(0);
  const [furthestStep, setFurthestStep] = useState<ArchiveStep>(0);
  const [pausedGuide, setPausedGuide] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [modal, setModal] = useState<ModalKey>(null);

  const [selectedDay, setSelectedDay] = useState(1);
  const [viewedDayMap, setViewedDayMap] = useState<Record<number, true>>({ 1: true });

  const [baselineDraft, setBaselineDraft] = useState<BaselineRange>(DEFAULT_BASELINE);
  const [baselineLocked, setBaselineLocked] = useState<BaselineRange | null>(null);
  const [rangeAnchorDay, setRangeAnchorDay] = useState<number | null>(null);

  const [learnProgress, setLearnProgress] = useState(0);
  const [step3Ready, setStep3Ready] = useState(false);

  const [monitorCursor, setMonitorCursor] = useState(1);
  const [monitorReviews, setMonitorReviews] = useState<Record<number, AlertReview>>({});

  const [tunedBaseline, setTunedBaseline] = useState<BaselineRange>(DEFAULT_BASELINE);
  const [tunedSensitivity, setTunedSensitivity] = useState<SensitivityLevel>("strict");
  const [tunedEval, setTunedEval] = useState<ReturnType<typeof runMonitorDetection> | null>(null);

  const [knowledgeShown, setKnowledgeShown] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  const [stepDurations, setStepDurations] = useState<Record<ArchiveStep, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  const viewedDays = useMemo(
    () =>
      Object.keys(viewedDayMap)
        .map((day) => Number(day))
        .sort((a, b) => a - b),
    [viewedDayMap],
  );

  const activeBaseline = baselineLocked ?? baselineDraft;
  const draftStats = useMemo(() => calcBaselineStats(baselineDraft), [baselineDraft]);
  const baselineStats = useMemo(() => calcBaselineStats(activeBaseline), [activeBaseline]);
  const monitorEval = useMemo(
    () => runMonitorDetection(activeBaseline, "balanced"),
    [activeBaseline],
  );

  const requiredReviewDays = useMemo(
    () => monitorEval.predictions.filter((item) => item.predictedAnomaly).map((item) => item.day),
    [monitorEval.predictions],
  );
  const reviewedAlerts = requiredReviewDays.filter((day) => monitorReviews[day] !== undefined).length;

  const reviewAccuracy = useMemo(() => {
    if (requiredReviewDays.length === 0) {
      return 1;
    }
    let correct = 0;
    for (const day of requiredReviewDays) {
      const prediction = monitorEval.predictions.find((item) => item.day === day);
      const review = monitorReviews[day];
      if (!prediction || !review) {
        continue;
      }
      if ((review === "anomaly") === prediction.point.realAnomaly) {
        correct += 1;
      }
    }
    return correct / requiredReviewDays.length;
  }, [monitorEval.predictions, monitorReviews, requiredReviewDays]);

  const finalAccuracy = useMemo(() => {
    const evalResult = tunedEval ?? monitorEval;
    const tunedStats = tunedEval ? calcBaselineStats(tunedBaseline) : baselineStats;
    const weighted = evalResult.accuracy * 0.58 + reviewAccuracy * 0.2 + tunedStats.qualityScore * 0.22;
    return clamp(round(weighted, 4), 0.42, 0.99);
  }, [baselineStats, monitorEval, reviewAccuracy, tunedBaseline, tunedEval]);

  const step1Record: Step1Record = {
    daysViewed: viewedDays.length,
    sensorsExplored: ["tilt", "humidity", "temperature"],
    timeSpent: stepDurations[0],
  };
  const step2Record: Step2Record = {
    baselineStart: activeBaseline.start,
    baselineEnd: activeBaseline.end,
    baselineLength: activeBaseline.end - activeBaseline.start + 1,
    containsAnomaly: baselineStats.containsAnomaly,
    timeSpent: stepDurations[1],
  };
  const step4Record: Step4Record = {
    alertsRaised: monitorEval.alertsRaised,
    trueAnomalies: monitorEval.trueAnomalies,
    falseAlarms: monitorEval.falseAlarms,
    accuracy: monitorEval.accuracy,
    timeSpent: stepDurations[3],
  };
  const step5Record: Step5Record = {
    baselineUpdated:
      tunedEval !== null &&
      (tunedBaseline.start !== activeBaseline.start || tunedBaseline.end !== activeBaseline.end),
    sensitivityLevel: tunedSensitivity,
    finalAccuracy,
    timeSpent: stepDurations[4],
  };

  const step1Complete = viewedDays.length >= 15;
  const step2Complete = baselineLocked !== null;
  const step3Complete = step3Ready;
  const step4Complete =
    monitorCursor >= monitorEval.predictions.length &&
    requiredReviewDays.every((day) => monitorReviews[day] !== undefined);
  const step5Complete = tunedEval !== null;

  const speechLines = useMemo(() => {
    if (step === 0) {
      return [...STEP1_GUIDE_LINES, `第${selectedDay}天：${dayNarration(selectedDay)}`];
    }
    if (step === 1) {
      return [
        ...STEP2_GUIDE_LINES,
        `当前选择：第 ${baselineDraft.start}-${baselineDraft.end} 天`,
        draftStats.containsAnomaly ? "当前区间含异常日，后续可能误报。" : "当前区间较稳定。",
      ];
    }
    if (step === 2) {
      const stage =
        learnProgress < 20
          ? "第1步：读取数据"
          : learnProgress < 40
            ? "第2步：计算均值"
            : learnProgress < 60
              ? "第3步：估计波动"
              : learnProgress < 80
                ? "第4步：建立规则"
                : "第5步：学习完成";
      return ["AI正在学习正常模式。", stage];
    }
    if (step === 3) {
      return [...STEP4_GUIDE_LINES, `监测进度 ${monitorCursor}/7，复核 ${reviewedAlerts}/${requiredReviewDays.length}`];
    }
    return ["你可以重新选基线并调整灵敏度。", `当前最终准确率：${formatPercent(finalAccuracy)}`];
  }, [
    baselineDraft.end,
    baselineDraft.start,
    draftStats.containsAnomaly,
    finalAccuracy,
    learnProgress,
    monitorCursor,
    requiredReviewDays.length,
    reviewedAlerts,
    selectedDay,
    step,
  ]);

  useEffect(() => {
    if (introDone || introIndex >= INTRO_SCENES.length - 1) {
      return;
    }
    const timer = setTimeout(
      () => setIntroIndex((current) => Math.min(current + 1, INTRO_SCENES.length - 1)),
      INTRO_SCENES[introIndex].durationMs,
    );
    return () => clearTimeout(timer);
  }, [introDone, introIndex]);

  useEffect(() => {
    if (pausedGuide || speechLines.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setSpeechIndex((current) => (current + 1) % speechLines.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [pausedGuide, speechLines]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }
    let tick = 0;
    const totalTicks = 62;
    const timer = setInterval(() => {
      tick += 1;
      const progress = Math.min(100, Math.round((tick / totalTicks) * 100));
      setLearnProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
      }
    }, 160);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 2 || learnProgress < 100 || step3Ready) {
      return;
    }
    const timer = setTimeout(() => setStep3Ready(true), 2000);
    return () => clearTimeout(timer);
  }, [learnProgress, step, step3Ready]);

  const autoModal: ModalKey =
    step === 0 && viewedDayMap[10] && !knowledgeShown.step1
      ? "step1"
      : step === 2 && learnProgress >= 50 && !knowledgeShown.step3
        ? "step3"
        : step === 3 && monitorCursor >= 4 && !knowledgeShown.step4
          ? "step4"
          : null;
  const activeModal = modal ?? autoModal;

  function closeModal() {
    if (!activeModal) {
      return;
    }
    setKnowledgeShown((prev) => ({
      ...prev,
      step1: activeModal === "step1" ? true : prev.step1,
      step2: activeModal === "step2" ? true : prev.step2,
      step3: activeModal === "step3" ? true : prev.step3,
      step4: activeModal === "step4" ? true : prev.step4,
    }));
    if (modal) {
      setModal(null);
    }
  }

  function markStepDuration(currentStep: ArchiveStep) {
    setStepDurations((prev) => ({
      ...prev,
      [currentStep]: Math.max(prev[currentStep], STEP_DEFAULT_SECONDS[currentStep]),
    }));
  }

  function moveToStep(nextStep: ArchiveStep) {
    if (nextStep === step) {
      return;
    }
    markStepDuration(step);
    setSpeechIndex(0);
    if (nextStep !== 1) {
      setRangeAnchorDay(null);
    }
    if (nextStep === 2) {
      setLearnProgress(0);
      setStep3Ready(false);
    }
    if (nextStep === 3) {
      setMonitorCursor(1);
      setMonitorReviews({});
    }
    if (nextStep === 4) {
      setTunedBaseline(activeBaseline);
      setTunedSensitivity("strict");
      setTunedEval(null);
    }
    setStep(nextStep);
    setFurthestStep((prev) => (nextStep > prev ? nextStep : prev));
  }

  function handleDayPick(day: number) {
    const safeDay = clamp(Math.round(day), 1, 30);
    if (step === 1) {
      if (rangeAnchorDay === null) {
        setRangeAnchorDay(safeDay);
        setBaselineDraft(clampBaselineRange({ start: safeDay, end: safeDay + 4 }));
      } else {
        setBaselineDraft(clampBaselineRange({ start: rangeAnchorDay, end: safeDay }));
        setRangeAnchorDay(null);
      }
      return;
    }
    setSelectedDay(safeDay);
    setViewedDayMap((prev) => (prev[safeDay] ? prev : { ...prev, [safeDay]: true }));
  }

  function lockBaseline() {
    setBaselineLocked(baselineDraft);
    setTunedBaseline(baselineDraft);
    if (!knowledgeShown.step2) {
      setModal("step2");
      setKnowledgeShown((prev) => ({ ...prev, step2: true }));
    }
  }

  function resetQuest() {
    setStep(0);
    setFurthestStep(0);
    setPausedGuide(false);
    setSpeechIndex(0);
    setModal(null);
    setSelectedDay(1);
    setViewedDayMap({ 1: true });
    setBaselineDraft(DEFAULT_BASELINE);
    setBaselineLocked(null);
    setRangeAnchorDay(null);
    setLearnProgress(0);
    setStep3Ready(false);
    setMonitorCursor(1);
    setMonitorReviews({});
    setTunedBaseline(DEFAULT_BASELINE);
    setTunedSensitivity("strict");
    setTunedEval(null);
    setKnowledgeShown({ step1: false, step2: false, step3: false, step4: false });
    setStepDurations({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
  }

  function previousStep() {
    if (step === 0) {
      onBack();
      return;
    }
    moveToStep((step - 1) as ArchiveStep);
  }

  function nextStep() {
    if (step === 0 && !step1Complete) return;
    if (step === 1 && !step2Complete) return;
    if (step === 2 && !step3Complete) return;
    if (step === 3 && !step4Complete) return;
    if (step === 4 && !step5Complete) return;

    if (step === 4) {
      markStepDuration(4);
      onComplete();
      return;
    }
    moveToStep((step + 1) as ArchiveStep);
  }

  const introScene = INTRO_SCENES[introIndex];
  const selectedPoint = ARCHIVE_HISTORY.find((item) => item.day === selectedDay) ?? ARCHIVE_HISTORY[0];
  const visiblePredictions = monitorEval.predictions.slice(0, monitorCursor);
  const oldErrors = monitorEval.falseAlarms + monitorEval.misses;
  const tunedErrors = tunedEval ? tunedEval.falseAlarms + tunedEval.misses : null;
  const improved = tunedErrors !== null && tunedErrors < oldErrors;

  if (!introDone) {
    return (
      <section className="game-panel-strong archive-quest relative overflow-hidden rounded-3xl p-6">
        <GameButton
          type="button"
          variant="secondary"
          className="absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-medium"
          onClick={() => setIntroDone(true)}
        >
          跳过动画
        </GameButton>
        <div className="grid min-h-[520px] gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <article className="game-panel rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-[#5d7891]">主题关卡2</p>
            <h2 className="font-display mt-3 text-4xl leading-tight text-[#234560]">{introScene.title}</h2>
            <p className="mt-3 text-sm text-[#4e6982]">{introScene.subtitle}</p>
            <div className="mt-6 rounded-2xl border border-[#cddfec] bg-white p-4 text-sm text-[#36556f]">
              {introScene.speech || "帮AI学会认“正常”，守护百年老楼。"}
            </div>
            {introIndex === INTRO_SCENES.length - 1 && (
              <GameButton
                type="button"
                variant="primary"
                className="mt-7 rounded-xl px-6 py-3 text-sm"
                onClick={() => setIntroDone(true)}
              >
                开始帮忙
              </GameButton>
            )}
          </article>
          <article className="game-panel rounded-3xl p-6">
            <p className="text-xs text-[#5a7390]">江南古书院场景</p>
            <div className="mt-3 h-52 rounded-2xl border border-[#c4d8ea] bg-[radial-gradient(circle_at_18%_24%,rgba(95,152,206,0.25),transparent_54%),radial-gradient(circle_at_78%_76%,rgba(84,156,116,0.18),transparent_50%),linear-gradient(165deg,#edf5ff_0%,#dce9f7_45%,#d8efe2_100%)]" />
            <p className="mt-4 text-sm text-[#40607a]">
              守阁灵状态：{introIndex < 3 ? "警觉" : introIndex === 3 ? "思考中" : "准备就绪"}
            </p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="game-quest archive-quest space-y-5">
      <div className="game-panel-strong rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#607b95]">主题关卡2</p>
            <h2 className="mt-1 text-lg font-semibold text-[#294965]">文枢阁的健康日记 · {STEP_TITLES[step]}</h2>
          </div>
          <span className="text-sm text-[#4d6780]">
            第 {step + 1} 步 / 共 {STEP_TITLES.length} 步 ({STEP_PROGRESS[step]}%)
          </span>
        </div>
        <GameProgress value={STEP_PROGRESS[step]} className="mt-3" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[310px_1fr]">
        <aside className="game-left-panel space-y-4 rounded-3xl p-5">
          <div className="rounded-2xl border border-[#c8daea] bg-[#f4f9ff] p-4">
            <p className="text-xs text-[#597790]">守阁灵搭档</p>
            <p className="mt-1 text-lg font-semibold text-[#2b4a63]">{playerName}</p>
            <p className="text-xs text-[#627e95]">{playerStyle}</p>
          </div>

          <div className="rounded-2xl border border-[#d0deea] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#67839c]">实时引导</p>
            <p className="mt-2 text-sm leading-7 text-[#2d4b66]">{speechLines[speechIndex]}</p>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              className="game-button game-button-primary rounded-xl px-3 py-2 text-sm"
              onClick={() => setPausedGuide((current) => !current)}
            >
              {pausedGuide ? "继续解说" : "暂停解说"}
            </button>
            <button
              type="button"
              className="game-button game-button-muted rounded-xl px-3 py-2 text-sm"
              onClick={resetQuest}
            >
              重置关卡2
            </button>
          </div>
        </aside>

        <main className="game-main-panel space-y-4 rounded-3xl p-5">
          <div className="grid gap-2 md:grid-cols-5">
            {STEP_TITLES.map((title, index) => {
              const indexStep = index as ArchiveStep;
              const clickable = indexStep <= furthestStep;
              return (
                <button
                  key={title}
                  type="button"
                  className={`game-button rounded-xl border px-2 py-2 text-xs ${
                    indexStep === step
                      ? "border-[rgba(85,233,255,0.55)] bg-[rgba(10,46,76,0.9)] text-[#c9f3ff]"
                      : clickable
                        ? "border-[rgba(66,136,170,0.42)] bg-[rgba(8,22,40,0.82)] text-[#9fd0e6]"
                        : "cursor-not-allowed border-[rgba(55,102,130,0.4)] bg-[rgba(7,18,34,0.78)] text-[#64859b]"
                  }`}
                  disabled={!clickable}
                  onClick={() => clickable && moveToStep(indexStep)}
                >
                  {index + 1}. {title}
                </button>
              );
            })}
          </div>

          {step === 0 && (
            <>
              <SensorChart
                points={ARCHIVE_HISTORY}
                selectedDay={selectedDay}
                viewedDays={viewedDays}
                onSelectDay={handleDayPick}
              />
              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-xs text-[#607b94]">时间轴（第1天 - 第30天）</p>
                  <input
                    className="mt-3 w-full accent-[#2b739e]"
                    type="range"
                    min={1}
                    max={30}
                    value={selectedDay}
                    onChange={(event) => handleDayPick(Number(event.target.value))}
                  />
                  <p className="mt-2 text-xs text-[#4f6b83]">已覆盖 {viewedDays.length} 天（至少15天可进入下一步）</p>
                </section>
                <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-xs text-[#607b94]">第 {selectedPoint.day} 天详情</p>
                  <div className="mt-2 h-28 rounded-xl border border-[#cfe0ed] bg-[linear-gradient(155deg,#f0f8ff_0%,#e4eef8_55%,#eaf4e8_100%)] p-3 text-xs text-[#4f6b83]">
                    墙面照片（静态示意）
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#3d5d79]">
                    <div className="rounded-lg border border-[#d7e4ef] bg-[#f7fbff] px-2 py-2">倾斜角 {selectedPoint.tilt}°</div>
                    <div className="rounded-lg border border-[#d7e4ef] bg-[#f7fbff] px-2 py-2">湿度 {selectedPoint.humidity}%</div>
                    <div className="rounded-lg border border-[#d7e4ef] bg-[#f7fbff] px-2 py-2">温度 {selectedPoint.temperature}℃</div>
                  </div>
                  <p className="mt-2 text-xs text-[#4e6b83]">{dayNarration(selectedPoint.day)}</p>
                </section>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <SensorChart
                points={ARCHIVE_HISTORY}
                selectedDay={baselineDraft.start}
                viewedDays={viewedDays}
                baselineRange={baselineDraft}
                onSelectDay={handleDayPick}
              />
              <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
                <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-sm font-medium text-[#2d4d66]">圈选“典型正常期”</p>
                  <p className="mt-1 text-xs text-[#516d83]">先点起始日，再点结束日。推荐连续5-10天。</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-[#547089]">
                      起始日
                      <input
                        className="mt-1 w-full accent-[#2b739e]"
                        type="range"
                        min={1}
                        max={30}
                        value={baselineDraft.start}
                        onChange={(event) =>
                          setBaselineDraft((previous) =>
                            clampBaselineRange({ start: Number(event.target.value), end: previous.end }),
                          )
                        }
                      />
                      <span className="mt-1 block text-sm text-[#2e4d66]">第 {baselineDraft.start} 天</span>
                    </label>
                    <label className="text-xs text-[#547089]">
                      结束日
                      <input
                        className="mt-1 w-full accent-[#2b739e]"
                        type="range"
                        min={1}
                        max={30}
                        value={baselineDraft.end}
                        onChange={(event) =>
                          setBaselineDraft((previous) =>
                            clampBaselineRange({ start: previous.start, end: Number(event.target.value) }),
                          )
                        }
                      />
                      <span className="mt-1 block text-sm text-[#2e4d66]">第 {baselineDraft.end} 天</span>
                    </label>
                  </div>
                </section>
                <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-sm font-medium text-[#2d4d66]">实时基线预览（均值 ± 2σ）</p>
                  <div className="mt-3 space-y-2 text-xs text-[#42617b]">
                    <p>倾斜角：{round(draftStats.meanTilt)} ± {round(draftStats.stdTilt * 2)}°</p>
                    <p>湿度：{round(draftStats.meanHumidity)} ± {round(draftStats.stdHumidity * 2)}%</p>
                    <p>温度：{round(draftStats.meanTemperature)} ± {round(draftStats.stdTemperature * 2)}℃</p>
                  </div>
                  <p className={`mt-3 text-xs font-medium ${draftStats.containsAnomaly ? "text-[#9a4721]" : "text-[#1f6a48]"}`}>
                    {draftStats.containsAnomaly ? "检测到异常日在区间内，建议重选。" : "区间平稳，适合作为基线。"}
                  </p>
                  <button
                    type="button"
                    className="game-button game-button-primary mt-4 rounded-xl px-4 py-2 text-sm"
                    onClick={lockBaseline}
                  >
                    锁定正常基线
                  </button>
                  {baselineLocked && (
                    <p className="mt-2 text-xs text-[#385975]">已锁定：第 {baselineLocked.start}-{baselineLocked.end} 天</p>
                  )}
                </section>
              </div>
            </>
          )}

          {step === 2 && (
            <section className="space-y-4 rounded-2xl border border-[#d4e1eb] bg-white p-5">
              <p className="text-sm text-[#4a667f]">AI开始学习“正常模式”</p>
              <div className="h-4 rounded-full bg-[#dbe8f2] p-[2px]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#2c77a6] to-[#79c2ca]" style={{ width: `${learnProgress}%` }} />
              </div>
              <p className="text-sm font-medium text-[#2f4d67]">{learnProgress}%</p>
              <div className="rounded-xl border border-[#d6e2ed] bg-[#f7fbff] p-3 text-sm text-[#3f5f79]">
                {learnProgress < 20 && "第1步：读取你选的基线数据"}
                {learnProgress >= 20 && learnProgress < 40 && "第2步：计算平均状态"}
                {learnProgress >= 40 && learnProgress < 60 && "第3步：确定波动范围"}
                {learnProgress >= 60 && learnProgress < 80 && "第4步：生成异常规则"}
                {learnProgress >= 80 && "第5步：学习完成"}
              </div>
              <p className="text-xs text-[#516d83]">{step3Ready ? "学习完成，可进入下一步。" : "学习中，完成后会自动激活下一步。"}</p>
            </section>
          )}

          {step === 3 && (
            <>
              <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#2d4d66]">最近7天监测流</p>
                  <p className="text-xs text-[#557087]">
                    已展示 {monitorCursor}/7 天，已复核报警 {reviewedAlerts}/{requiredReviewDays.length}
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-xl border border-[#c8dbe9] bg-[#f5fbff] px-3 py-2 text-sm text-[#386281] disabled:opacity-55"
                  disabled={monitorCursor >= monitorEval.predictions.length}
                  onClick={() => setMonitorCursor((current) => Math.min(current + 1, monitorEval.predictions.length))}
                >
                  {monitorCursor < monitorEval.predictions.length ? "接收下一天打卡" : "7天已全部接收"}
                </button>
              </section>

              <section className="grid gap-3">
                {visiblePredictions.map((prediction) => {
                  const review = monitorReviews[prediction.day];
                  return (
                    <article key={`monitor-${prediction.day}`} className={`rounded-2xl border p-4 ${prediction.predictedAnomaly ? "border-[#f0c6b0] bg-[#fff7f3]" : "border-[#cde5d7] bg-[#f5fbf7]"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#2c4a63]">第 {prediction.day} 天</p>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${prediction.predictedAnomaly ? "bg-[#ffd8c7] text-[#9a4924]" : "bg-[#d8f0e1] text-[#236648]"}`}>
                          AI判定：{prediction.predictedAnomaly ? "异常" : "正常"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#4a657b]">
                        倾斜角 {prediction.point.tilt}° · 湿度 {prediction.point.humidity}% · 温度 {prediction.point.temperature}℃
                      </p>
                      {prediction.predictedAnomaly && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${review === "anomaly" ? "bg-[#d85a2d] text-white" : "border border-[#efc4b1] bg-white text-[#994c2a]"}`}
                            onClick={() => setMonitorReviews((prev) => ({ ...prev, [prediction.day]: "anomaly" }))}
                          >
                            真的异常
                          </button>
                          <button
                            type="button"
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${review === "false_alarm" ? "bg-[#2d8f5e] text-white" : "border border-[#b8dbc8] bg-white text-[#236547]"}`}
                            onClick={() => setMonitorReviews((prev) => ({ ...prev, [prediction.day]: "false_alarm" }))}
                          >
                            误报
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <section className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <article className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-sm font-medium text-[#2d4d66]">调整基线区间</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-[#547089]">
                      起始日
                      <input
                        className="mt-1 w-full accent-[#2b739e]"
                        type="range"
                        min={1}
                        max={30}
                        value={tunedBaseline.start}
                        onChange={(event) =>
                          setTunedBaseline((previous) =>
                            clampBaselineRange({ start: Number(event.target.value), end: previous.end }),
                          )
                        }
                      />
                    </label>
                    <label className="text-xs text-[#547089]">
                      结束日
                      <input
                        className="mt-1 w-full accent-[#2b739e]"
                        type="range"
                        min={1}
                        max={30}
                        value={tunedBaseline.end}
                        onChange={(event) =>
                          setTunedBaseline((previous) =>
                            clampBaselineRange({ start: previous.start, end: Number(event.target.value) }),
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-[#4c6780]">当前区间：第 {tunedBaseline.start}-{tunedBaseline.end} 天</p>
                </article>
                <article className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-sm font-medium text-[#2d4d66]">异常灵敏度</p>
                  <div className="mt-3 grid gap-2">
                    {SENSITIVITY_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`rounded-xl border px-3 py-2 text-left ${tunedSensitivity === item.value ? "border-[#7caed2] bg-[#eaf3fa] text-[#1f567f]" : "border-[#d3e0eb] bg-white text-[#4f6a82]"}`}
                        onClick={() => setTunedSensitivity(item.value)}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs">{item.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </article>
              </section>

              <button
                type="button"
                className="game-button game-button-primary rounded-xl px-4 py-2 text-sm"
                onClick={() => setTunedEval(runMonitorDetection(tunedBaseline, tunedSensitivity))}
              >
                模拟测试
              </button>

              {tunedEval && (
                <section className="rounded-2xl border border-[#d4e1eb] bg-white p-4">
                  <p className="text-sm font-semibold text-[#2d4d66]">优化效果对比</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#405f78] sm:grid-cols-2">
                    <div className="rounded-xl border border-[#d8e4ef] bg-[#f8fbff] p-3">
                      旧设置：误报 {monitorEval.falseAlarms} 次，漏报 {monitorEval.misses} 次，准确率 {formatPercent(monitorEval.accuracy)}
                    </div>
                    <div className="rounded-xl border border-[#d8e4ef] bg-[#f8fbff] p-3">
                      新设置：误报 {tunedEval.falseAlarms} 次，漏报 {tunedEval.misses} 次，准确率 {formatPercent(tunedEval.accuracy)}
                    </div>
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${improved ? "text-[#1f6a48]" : "text-[#8c5a2f]"}`}>
                    {improved ? "改进成功，监测更稳定了。" : "当前设置没有提升，建议继续调参。"}
                  </p>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="game-button game-button-muted rounded-xl px-4 py-2 text-sm"
          onClick={previousStep}
        >
          {step === 0 ? "返回关卡选择" : "上一步"}
        </button>
        <button
          type="button"
          className="game-button game-button-primary rounded-xl px-5 py-2 text-sm disabled:bg-[#667f95]"
          disabled={
            (step === 0 && !step1Complete) ||
            (step === 1 && !step2Complete) ||
            (step === 2 && !step3Complete) ||
            (step === 3 && !step4Complete) ||
            (step === 4 && !step5Complete)
          }
          onClick={nextStep}
        >
          {step === 4 ? "完成关卡" : "下一步"}
        </button>
      </div>

      <div className="rounded-2xl border border-[#d2dfeb] bg-[rgba(255,255,255,0.9)] p-4 text-xs text-[#4f6b83]">
        <p className="font-medium text-[#345773]">数据记录（Demo）</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <pre className="overflow-auto rounded-lg border border-[#d6e3ed] bg-white p-2">{JSON.stringify(step1Record, null, 2)}</pre>
          <pre className="overflow-auto rounded-lg border border-[#d6e3ed] bg-white p-2">{JSON.stringify(step2Record, null, 2)}</pre>
          <pre className="overflow-auto rounded-lg border border-[#d6e3ed] bg-white p-2">{JSON.stringify(step4Record, null, 2)}</pre>
          <pre className="overflow-auto rounded-lg border border-[#d6e3ed] bg-white p-2">{JSON.stringify(step5Record, null, 2)}</pre>
        </div>
      </div>

      {activeModal && <InfoModal type={activeModal} onClose={closeModal} />}
    </section>
  );
}

