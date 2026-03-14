"use client";

import { useEffect } from "react";
import { useMobile } from "@/components/hooks/useMobile";
import FarmCertificateCard from "@/components/farm/FarmCertificateCard";
import { FARM_KNOWLEDGE_CARDS, type FarmCertificateSnapshot } from "@/lib/farm/terminology";

interface FarmKnowledgeRevealProps {
  playerName: string;
  certificate: FarmCertificateSnapshot | null;
  returnLabel: string;
  onSeen: () => void;
  onBack: () => void;
}

export default function FarmKnowledgeReveal({
  playerName,
  certificate,
  returnLabel,
  onSeen,
  onBack,
}: FarmKnowledgeRevealProps) {
  useEffect(() => {
    onSeen();
  }, [onSeen]);

  const studentName = playerName.trim() || "小老师";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f0c8_0%,#f0dfaf_28%,#d8c28a_54%,#8e7447_100%)] px-4 py-6 text-[#442f18] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {certificate ? (
          <FarmCertificateCard certificate={certificate} />
        ) : (
          <section className="rounded-[30px] border border-[#d7bb7a] bg-[linear-gradient(180deg,rgba(255,250,236,0.98),rgba(248,236,199,0.96))] p-5 shadow-[0_24px_50px_rgba(76,54,20,0.18)] sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8b6531]">结业证书</p>
            <h2 className="font-display mt-2 text-2xl text-[#53371b] sm:text-3xl">AI小当家·结业证书</h2>
            <p className="mt-3 text-sm leading-7 text-[#6b4b21]">
              这次还没有找到证书快照。等你完整通关一次后，这里会自动生成你的结业证书图片。
            </p>
          </section>
        )}

        <section className="relative overflow-hidden rounded-[30px] border border-[#d7bb7a] bg-[linear-gradient(135deg,rgba(255,249,231,0.98),rgba(248,236,197,0.96))] p-5 shadow-[0_28px_60px_rgba(64,45,18,0.2)] sm:p-7">
          <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,228,157,0.68),rgba(255,228,157,0))]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8b6531]">彩蛋揭秘</p>
          <h1 className="font-display mt-3 text-3xl text-[#53371b] sm:text-4xl">关卡1知识彩蛋揭秘</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b4b21] sm:text-base">
            {studentName}，刚才在稻田里你听到的都是帮助小朋友理解的比喻。现在我们把这些比喻翻过来看看，原来它们在真正的
            AI 学习里分别叫什么名字。
          </p>
          <div className="mt-4 inline-flex rotate-[-2deg] rounded-2xl border border-[#d4b06c] bg-[#fff4cf] px-4 py-3 text-sm font-semibold text-[#6a481e] shadow-[0_10px_24px_rgba(121,88,33,0.16)]">
            游戏里先说小朋友听得懂的话，通关后再揭秘专业名字。
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FARM_KNOWLEDGE_CARDS.map((card, index) => (
            <article
              key={card.realTerm}
              className="relative overflow-hidden rounded-[26px] border border-[#d4bb86] bg-[linear-gradient(180deg,rgba(255,252,244,0.98),rgba(247,239,216,0.96))] p-5 shadow-[0_18px_36px_rgba(70,53,26,0.14)]"
            >
              <div className="absolute right-4 top-4 rounded-full border border-[#ebd7ad] bg-[#fff7df] px-2.5 py-1 text-[11px] font-semibold text-[#8e6a37]">
                彩蛋 {index + 1}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7847]">游戏里这样说</p>
              <p className="mt-2 text-lg font-semibold text-[#5a3c1d]">{card.kidTerm}</p>
              <div className="mt-4 rounded-2xl border border-[#d8bf8e] bg-[#fff8e4] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c7640]">真正名字</p>
                <p className="mt-1 text-base font-semibold text-[#5f401e]">{card.realTerm}</p>
              </div>
              <p className="mt-4 text-sm font-semibold text-[#624220]">{card.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#73532b]">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-[#d4bb86] bg-[rgba(255,249,233,0.96)] p-5 shadow-[0_16px_32px_rgba(58,42,18,0.14)] sm:p-6">
          <p className="text-sm font-semibold text-[#5c3d1d]">你已经完成了这一关的两层学习</p>
          <p className="mt-2 text-sm leading-7 text-[#6e5028]">
            第一层，是在故事里教小麦学会判断。第二层，是在彩蛋里认识这些聪明办法在真实世界里的名字。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl bg-[linear-gradient(135deg,#f3c86e_0%,#c98931_100%)] px-5 py-3 text-sm font-semibold text-[#2f1f0f] shadow-[0_14px_28px_rgba(99,68,28,0.24)]"
              onClick={onBack}
            >
              {returnLabel}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
