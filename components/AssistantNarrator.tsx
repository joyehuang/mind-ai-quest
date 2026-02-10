"use client";

import { useMemo } from "react";

type NarratorTheme = "farm" | "wenshuge";

interface AssistantNarratorProps {
  name: string;
  style: string;
  message: string;
  theme?: NarratorTheme;
  className?: string;
}

function hashText(text: string) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100003;
  }
  return Math.abs(hash);
}

function pickBySeed<T>(list: T[], seed: number, offset: number) {
  return list[(seed + offset) % list.length];
}

function roleLabel(style: string) {
  if (style === "工程师") return "工程师助手";
  if (style === "探险家") return "探险家助手";
  return "侦查员助手";
}

export default function AssistantNarrator({
  name,
  style,
  message,
  theme = "farm",
  className,
}: AssistantNarratorProps) {
  const seed = useMemo(() => hashText(`${name}-${style}`), [name, style]);

  const skinColor = pickBySeed(["#f7d7be", "#efc9ab", "#e8bc98", "#dbad87"], seed, 2);
  const hairColor = pickBySeed(["#2f2a27", "#4a372d", "#5a4633", "#253348"], seed, 5);
  const coatColor = pickBySeed(["#5f83c2", "#7e6eb0", "#44778d", "#7b8c56"], seed, 8);
  const accentColor = theme === "farm" ? "#d8ae64" : "#78b6d8";
  const bubbleBorder = theme === "farm" ? "border-[#b99661]" : "border-[#7ba6cf]";
  const bubbleBg = theme === "farm" ? "bg-[rgba(255,246,228,0.92)]" : "bg-[rgba(233,245,255,0.9)]";
  const bubbleText = theme === "farm" ? "text-[#624826]" : "text-[#2a4c78]";
  const bubbleTitle = theme === "farm" ? "text-[#7b5929]" : "text-[#39608f]";
  const tailColor = theme === "farm" ? "bg-[rgba(255,246,228,0.92)]" : "bg-[rgba(233,245,255,0.9)]";
  const badgeBg = theme === "farm" ? "bg-[#f2dcb6]" : "bg-[#c7def7]";
  const badgeText = theme === "farm" ? "text-[#6d4b1f]" : "text-[#27486f]";

  return (
    <div className={`flex items-end gap-2 ${className ?? ""}`}>
      <div className="relative h-[70px] w-[70px] shrink-0">
        <div
          className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.28)] shadow-[0_8px_20px_rgba(8,12,24,0.35)]"
          style={{
            background: `linear-gradient(160deg, ${coatColor}, ${accentColor})`,
          }}
        />

        <div
          className="absolute left-1/2 top-[16px] h-[34px] w-[34px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: skinColor }}
        />
        <div
          className="absolute left-1/2 top-[10px] h-[18px] w-[38px] -translate-x-1/2 rounded-[50%]"
          style={{ backgroundColor: hairColor }}
        />

        <span className="absolute left-[23px] top-[31px] h-[4px] w-[4px] rounded-full bg-[#2d3138]" />
        <span className="absolute left-[43px] top-[31px] h-[4px] w-[4px] rounded-full bg-[#2d3138]" />
        <span className="absolute left-1/2 top-[40px] h-[2px] w-[10px] -translate-x-1/2 rounded-full bg-[#925f4b]" />

        {style === "工程师" && (
          <>
            <span className="absolute left-[18px] top-[27px] h-[12px] w-[14px] rounded-full border border-[rgba(34,48,71,0.75)]" />
            <span className="absolute left-[37px] top-[27px] h-[12px] w-[14px] rounded-full border border-[rgba(34,48,71,0.75)]" />
            <span className="absolute left-[33px] top-[32px] h-[1.5px] w-[4px] bg-[rgba(34,48,71,0.75)]" />
          </>
        )}

        {style === "探险家" && (
          <span className="absolute left-1/2 top-[7px] h-[5px] w-[42px] -translate-x-1/2 rounded-full bg-[rgba(64,47,30,0.7)]" />
        )}

        {style === "侦查员" && (
          <span className="absolute right-[8px] top-[34px] h-[8px] w-[8px] rounded-full border border-[rgba(46,62,94,0.8)] bg-[rgba(187,209,241,0.8)]" />
        )}
      </div>

      <div className="relative max-w-[360px]">
        <div className={`absolute -left-1.5 bottom-5 h-3 w-3 rotate-45 border-l border-b ${bubbleBorder} ${tailColor}`} />
        <article className={`rounded-2xl border ${bubbleBorder} ${bubbleBg} p-3 shadow-[0_10px_24px_rgba(10,16,28,0.2)]`}>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${bubbleTitle}`}>AI Narrator</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className={`text-xs font-semibold ${bubbleText}`}>{name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeBg} ${badgeText}`}>
              {roleLabel(style)}
            </span>
          </div>
          <p className={`mt-1 text-xs leading-5 ${bubbleText}`}>{message}</p>
        </article>
      </div>
    </div>
  );
}
