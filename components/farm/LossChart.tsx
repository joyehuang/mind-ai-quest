"use client";

import { useMemo } from "react";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";
import type { LossPoint } from "@/lib/farm/types";

interface LossChartProps {
  points: LossPoint[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const PADDING = { top: 18, right: 26, bottom: 38, left: 58 };

function toPath(points: string[]) {
  return points.join(" ");
}

export default function LossChart({ points }: LossChartProps) {
  const { trainPath, testPath, yTicks, maxLoss, minLoss } = useMemo(() => {
    if (points.length === 0) {
      return {
        trainPath: "",
        testPath: "",
        yTicks: [0.2, 0.4, 0.6, 0.8],
        maxLoss: 1,
        minLoss: 0,
      };
    }

    const values = points.flatMap((point) => [point.trainLoss, point.testLoss]);
    const maxLoss = Math.max(...values);
    const minLoss = Math.min(...values);

    const chartInnerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const chartInnerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    const x = (index: number) =>
      PADDING.left + (points.length <= 1 ? 0 : index / (points.length - 1)) * chartInnerWidth;
    const y = (value: number) => {
      const ratio = (value - minLoss) / Math.max(maxLoss - minLoss, 0.0001);
      return CHART_HEIGHT - PADDING.bottom - ratio * chartInnerHeight;
    };

    const trainPath = toPath(
      points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.trainLoss).toFixed(2)}`),
    );
    const testPath = toPath(
      points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.testLoss).toFixed(2)}`),
    );

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      return minLoss + (maxLoss - minLoss) * ratio;
    });

    return { trainPath, testPath, yTicks, maxLoss, minLoss };
  }, [points]);

  return (
    <div className="rounded-2xl border border-[#d2dcee] bg-white p-4">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#3d5078]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-[#4d86e6]" /> 旧练习题上的{FARM_METAPHOR_LABELS.confusionLevel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-[#cf7b4e]" /> 新考题上的{FARM_METAPHOR_LABELS.confusionLevel}
        </span>
      </div>

      <svg
        className="h-auto w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="小麦复习时的犯错指数变化曲线"
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={CHART_WIDTH - PADDING.left - PADDING.right}
          height={CHART_HEIGHT - PADDING.top - PADDING.bottom}
          fill="#f4f7ff"
          stroke="#d4dff2"
          rx={12}
        />

        {yTicks.map((tick, index) => {
          const ratio = (tick - minLoss) / Math.max(maxLoss - minLoss, 0.0001);
          const y = CHART_HEIGHT - PADDING.bottom - ratio * (CHART_HEIGHT - PADDING.top - PADDING.bottom);
          return (
            <g key={index}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="#e1e8f5"
                strokeDasharray="5 5"
              />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#66789f">
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {points.length > 0 && (
          <>
            <path d={trainPath} fill="none" stroke="#4d86e6" strokeWidth="3" strokeLinecap="round" />
            <path d={testPath} fill="none" stroke="#cf7b4e" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        <text x={CHART_WIDTH / 2 - 36} y={CHART_HEIGHT - 8} fontSize="12" fill="#66789f">
          {FARM_METAPHOR_LABELS.reviewRounds}
        </text>
        <text
          x={18}
          y={CHART_HEIGHT / 2}
          transform={`rotate(-90 18 ${CHART_HEIGHT / 2})`}
          textAnchor="middle"
          fontSize="12"
          fill="#66789f"
        >
          {FARM_METAPHOR_LABELS.mistakeIndex}
        </text>
      </svg>
    </div>
  );
}
