"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useMobile } from "./hooks/useMobile";

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
  const { isMobile } = useMobile();
  const seed = useMemo(() => hashText(`${name}-${style}`), [name, style]);

  // 移动端缩小样式
  const avatarSize = isMobile ? 64 : (position === "bottom" ? 80 : 120);
  const avatarSizeSm = isMobile ? "64px" : (position === "bottom" ? "80px" : "120px");
  const bubbleMaxWidth = isMobile ? "240px" : "min(60vw,580px)";
  const bubblePadding = isMobile ? "p-2.5" : "p-3 sm:p-5";
  const textSize = isMobile ? "text-xs" : "text-sm sm:text-base";

  const accentColor = theme === "farm" ? "#ffd700" : "#78b6d8";
  const bubbleBorder = theme === "farm" ? "border-[#ffd700]" : "border-[#7ba6cf]";
  const bubbleBg = theme === "farm" ? "bg-[rgba(255,255,240,0.98)]" : "bg-[rgba(233,245,255,0.9)]";
  const bubbleText = theme === "farm" ? "text-[#4a3728]" : "text-[#2a4c78]";
  const badgeBg = theme === "farm" ? "bg-[#fff4d6]" : "bg-[#c7def7]";
  const badgeText = theme === "farm" ? "text-[#7a5a1f]" : "text-[#27486f]";

  const isBottom = position === "bottom";

  return (
    <div
      className={`flex ${isBottom ? "flex-col-reverse items-center gap-2" : "flex-row items-end gap-3"} ${className ?? ""}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0" style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}>
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
      <div className="relative" style={{ maxWidth: bubbleMaxWidth }}>
        <div
          className={`absolute ${isBottom ? "-bottom-1.5 left-1/2 -translate-x-1/2 rotate-[135deg]" : "-left-1.5 bottom-8 rotate-45"} h-3 w-3 border-l border-b ${bubbleBorder} ${bubbleBg}`}
        />
        <article
          className={`rounded-2xl border ${bubbleBorder} ${bubbleBg} ${bubblePadding} shadow-[0_10px_24px_rgba(10,16,28,0.2)] ${isBottom ? "text-center" : ""}`}
        >
          <div className={`flex flex-wrap items-center gap-2 ${isBottom ? "justify-center" : ""}`}>
            <p className={`${textSize} font-semibold ${bubbleText}`}>{name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeBg} ${badgeText}`}>
              {roleLabel(style)}
            </span>
          </div>
          <p className={`mt-2 ${textSize} leading-6 ${bubbleText}`}>{message}</p>
        </article>
      </div>
    </div>
  );
}
