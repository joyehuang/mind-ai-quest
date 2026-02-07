"use client";

import { useMemo } from "react";
import type { LossPoint } from "@/lib/farm/types";

interface LossChartProps {
  points: LossPoint[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const PADDING = { top: 18, right: 26, bottom: 38, left: 46 };

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
    <div className="rounded-2xl border border-[rgba(69,199,255,0.34)] bg-[rgba(7,23,43,0.88)] p-4">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#9acfe5]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-[#31d2ff]" /> 训练集 Loss
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-[#ffd166]" /> 测试集 Loss
        </span>
      </div>

      <svg
        className="h-auto w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="训练与测试 loss 曲线"
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={CHART_WIDTH - PADDING.left - PADDING.right}
          height={CHART_HEIGHT - PADDING.top - PADDING.bottom}
          fill="#071b33"
          stroke="rgba(74,193,244,0.35)"
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
                stroke="rgba(83,173,219,0.25)"
                strokeDasharray="5 5"
              />
              <text x={10} y={y + 4} fontSize="11" fill="#88cbe5">
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {points.length > 0 && (
          <>
            <path d={trainPath} fill="none" stroke="#31d2ff" strokeWidth="3" strokeLinecap="round" />
            <path d={testPath} fill="none" stroke="#ffd166" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        <text x={CHART_WIDTH / 2 - 45} y={CHART_HEIGHT - 8} fontSize="12" fill="#95cfe8">
          训练轮次 Epoch
        </text>
        <text x={8} y={16} fontSize="12" fill="#95cfe8">
          Loss
        </text>
      </svg>
    </div>
  );
}
