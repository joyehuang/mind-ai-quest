"use client";

import Image from "next/image";
import { useMemo } from "react";

type NarratorTheme = "farm" | "wenshuge";
type Position = "left" | "bottom";

interface AssistantNarratorProps {
  name: string;
  style: string;
  message: string;
  theme?: NarratorTheme;
  position?: Position;
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
  position = "left",
  className,
}: AssistantNarratorProps) {
  const seed = useMemo(() => hashText(`${name}-${style}`), [name, style]);

  const accentColor = theme === "farm" ? "#ffd700" : "#78b6d8";
  const bubbleBorder = theme === "farm" ? "border-[#ffd700]" : "border-[#7ba6cf]";
  const bubbleBg = theme === "farm" ? "bg-[rgba(255,255,240,0.98)]" : "bg-[rgba(233,245,255,0.9)]";
  const bubbleText = theme === "farm" ? "text-[#4a3728]" : "text-[#2a4c78]";
  const bubbleTitle = theme === "farm" ? "text-[#8b6914]" : "text-[#39608f]";
  const badgeBg = theme === "farm" ? "bg-[#fff4d6]" : "bg-[#c7def7]";
  const badgeText = theme === "farm" ? "text-[#7a5a1f]" : "text-[#27486f]";

  // Desktop: horizontal layout (avatar left, bubble right)
  // Mobile bottom: vertical layout (bubble top, avatar bottom, centered)
  const isBottom = position === "bottom";

  return (
    <div
      className={`flex ${isBottom ? "flex-col-reverse items-center gap-2" : "flex-row items-end gap-3"} ${className ?? ""}`}
    >
      {/* Avatar */}
      <div className={`relative shrink-0 ${isBottom ? "h-20 w-20" : "h-[120px] w-[120px] sm:h-[180px] sm:w-[180px]"}`}>
        <Image
          src="/assistant-avatar.png"
          alt="助手"
          width={2048}
          height={2048}
          className="h-full w-full object-contain"
          priority
        />
      </div>

      {/* Bubble */}
      <div className={`relative ${isBottom ? "w-full max-w-[calc(100vw-2rem)]" : "max-w-[min(60vw,580px)]"}`}>
        <div
          className={`absolute ${isBottom ? "-bottom-1.5 left-1/2 -translate-x-1/2 rotate-[135deg]" : "-left-1.5 bottom-8 rotate-45"} h-3 w-3 border-l border-b ${bubbleBorder} ${bubbleBg}`}
        />
        <article
          className={`rounded-2xl border ${bubbleBorder} ${bubbleBg} p-3 sm:p-5 shadow-[0_10px_24px_rgba(10,16,28,0.2)] ${isBottom ? "text-center" : ""}`}
        >
          <div className={`flex flex-wrap items-center gap-2 ${isBottom ? "justify-center" : ""}`}>
            <p className={`text-sm sm:text-base font-semibold ${bubbleText}`}>{name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${badgeBg} ${badgeText}`}>
              {roleLabel(style)}
            </span>
          </div>
          <p className={`mt-2 text-sm sm:text-base leading-6 sm:leading-7 ${bubbleText}`}>{message}</p>
        </article>
      </div>
    </div>
  );
}
