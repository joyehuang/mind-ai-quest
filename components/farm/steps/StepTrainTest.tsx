"use client";

import { useMobile } from "@/components/hooks/useMobile";
import { toPercent } from "@/lib/farm/scoring";
import { FARM_METAPHOR_LABELS } from "@/lib/farm/terminology";
import type { ConfusionMetrics, PredictionRecord } from "@/lib/farm/types";

interface StepTrainTestProps {
  trainProgress: number;
  step2Score: number;
  step2Errors: number;
  trainingSetQuality: number;
  targetAccuracy: number;
  predictions: PredictionRecord[];
  confusion: ConfusionMetrics;
}

function labelText(value: "healthy" | "unhealthy") {
  return value === "healthy" ? "健康" : "不健康";
}

export default function StepTrainTest({
  trainProgress,
  step2Score,
  step2Errors,
  trainingSetQuality,
  targetAccuracy,
  predictions,
  confusion,
}: StepTrainTestProps) {
  const done = trainProgress >= 100;
  const { isMobile } = useMobile();

  // 移动端布局
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#b9cae8] bg-[#eef3ff] p-3">
          <p className="text-sm font-semibold text-[#274067]">第三步：小麦复习并参加测验</p>

          {/* 进度条 */}
          <div className="mt-3 h-3 rounded-full bg-[#d8e2f4] p-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6ea9ff] to-[#f2c27a]"
              style={{ width: `${Math.min(trainProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-[#355f9f]">复习进度：{trainProgress}%</p>

          {!done && (
            <div className="mt-2 space-y-1 text-xs text-[#576a92]">
              <p>贴标签答对率：{toPercent(step2Score)}</p>
              <p>{FARM_METAPHOR_LABELS.textbookReadiness}：{toPercent(trainingSetQuality)}</p>
            </div>
          )}
        </div>

        {done ? (
          <>
            {/* 成绩卡片 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#d0dbee] bg-white p-3">
                <p className="text-[10px] text-[#63749a]">测验田答对率</p>
                <p className="mt-1 text-xl font-semibold text-[#2c4f86]">{toPercent(confusion.accuracy)}</p>
              </div>
              <div className="rounded-xl border border-[#d0dbee] bg-white p-3">
                <p className="text-[10px] text-[#63749a]">揪坏稻子本领</p>
                <p className="mt-1 text-xl font-semibold text-[#2c4f86]">{toPercent(confusion.recall)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#d0dbef] bg-[#f4f7ff] p-3 text-xs text-[#364975]">
              小麦在测验田答对了 {predictions.filter((item) => item.correct).length} 株，共 {predictions.length} 株。
            </div>

            {/* 滚动表格 */}
            <div className="-mx-3 overflow-x-auto rounded-2xl border border-[#d0dbef] bg-white">
              <div className="min-w-[400px] p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#dee5f3] text-[#596d97]">
                      <th className="px-2 py-2">样本</th>
                      <th className="px-2 py-2">真实</th>
                      <th className="px-2 py-2">猜测</th>
                      <th className="px-2 py-2">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((item) => (
                      <tr key={item.sample.id} className="border-b border-[#edf2fa] text-[#394b73]">
                        <td className="px-2 py-2">{item.sample.name}</td>
                        <td className="px-2 py-2">{labelText(item.sample.groundTruth)}</td>
                        <td className="px-2 py-2">{labelText(item.predicted)}</td>
                        <td className="px-2 py-2">{item.correct ? "✓" : "✗"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-[#cdd9ee] bg-white px-3 py-3 text-sm text-[#44567f]">
            小麦正在翻看练习田的教材，复习结束后就会自动展示测验田的小测验成绩。
          </p>
        )}
      </div>
    );
  }

  // 桌面端布局
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#b9cae8] bg-[#eef3ff] p-4">
        <p className="text-sm font-semibold text-[#274067]">第三步：小麦复习并参加测验</p>
        <p className="mt-1 text-xs text-[#576a92]">
          第二步贴答案标签的答对率：{toPercent(step2Score)}（还有 {step2Errors} 题没贴对）
        </p>
        <p className="mt-1 text-xs text-[#576a92]">
          {FARM_METAPHOR_LABELS.textbookReadiness}：{toPercent(trainingSetQuality)}。教材越丰富，小麦在测验田里越不容易发懵。
        </p>

        <div className="mt-3 h-4 rounded-full bg-[#d8e2f4] p-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6ea9ff] to-[#f2c27a]"
            style={{ width: `${Math.min(trainProgress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-[#355f9f]">小麦复习进度：{trainProgress}%</p>
      </div>

      {done ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#63749a]">测验田答对率</p>
              <p className="mt-1 text-2xl font-semibold text-[#2c4f86]">{toPercent(confusion.accuracy)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#63749a]">揪出坏稻子的本领</p>
              <p className="mt-1 text-2xl font-semibold text-[#2c4f86]">{toPercent(confusion.recall)}</p>
            </article>
            <article className="rounded-2xl border border-[#d0dbee] bg-white p-4">
              <p className="text-xs text-[#63749a]">预计能答对多少</p>
              <p className="mt-1 text-2xl font-semibold text-[#2c4f86]">{toPercent(targetAccuracy)}</p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#d0dbee] bg-[#f4f7ff] p-4 text-sm text-[#364975]">
            这次小麦一共猜对了 {predictions.filter((item) => item.correct).length} 株稻子，共有 {predictions.length} 株，
            所以测验田的{FARM_METAPHOR_LABELS.answerRate}是 {toPercent(confusion.accuracy)}。
          </div>

          <div className="-mx-3 overflow-x-auto rounded-2xl border border-[#d0dbee] bg-white">
            <div className="min-w-[640px] p-3">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dee5f3] text-[#596d97]">
                    <th className="px-2 py-2">样本</th>
                    <th className="px-2 py-2">真正情况</th>
                    <th className="px-2 py-2">小麦的猜测</th>
                    <th className="px-2 py-2">这题结果</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((item) => (
                    <tr key={item.sample.id} className="border-b border-[#edf2fa] text-[#394b73]">
                      <td className="px-2 py-2">{item.sample.name}</td>
                      <td className="px-2 py-2">{labelText(item.sample.groundTruth)}</td>
                      <td className="px-2 py-2">{labelText(item.predicted)}</td>
                      <td className="px-2 py-2">{item.correct ? "答对了" : "答错了"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-[#cdd9ee] bg-white px-3 py-3 text-sm text-[#44567f]">
          小麦正在翻看练习田的教材，复习结束后就会自动展示测验田的小测验成绩。
        </p>
      )}
    </div>
  );
}
