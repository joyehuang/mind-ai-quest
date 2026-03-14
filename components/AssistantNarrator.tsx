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
  const { isMobile, windowWidth } = useMobile();
  const seed = useMemo(() => hashText(`${name}-${style}`), [name, style]);

  // 根据屏幕大小调整样式
  const avatarSize = isMobile ? 64 : windowWidth < 640 ? 100 : 140;
  const avatarSizeSm = isMobile ? "64px" : windowWidth < 640 ? "100px" : "140px";
  const bubbleMaxWidth = isMobile ? "calc(100vw - 2rem)" : "min(60vw,580px)";
  const padding = isMobile ? "p-3" : "p-5";
  const textSize = isMobile ? "text-sm" : "text-base";
  const titleSize = isMobile ? "text-[10px]" : "text-[11px]";
  const leading = isMobile ? "leading-6" : "leading-7";

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
      <div 
        className={`relative shrink-0`}
        style={{ height: `${avatarSize}px`, width: `${avatarSize}px` }}
      >
        <div
          className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.28)] shadow-[0_8px_20px_rgba(8,12,24,0.35)] overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${accentColor}, ${accentColor}40)`,
          }}
        >
          <Image
            src="https://bear-public.tos-cn-shanghai.volces.com/avatar.webp"
            alt="AI Assistant"
            fill
            className="object-cover"
            sizes={avatarSizeSm}
          />
        </div>
      </div>

      {/* Bubble */}
      <div 
        className={`relative`}
        style={{ maxWidth: bubbleMaxWidth }}
      >
        <div
          className={`absolute ${isBottom ? "-bottom-1.5 left-1/2 -translate-x-1/2 rotate-[135deg]" : "-left-1.5 bottom-8 rotate-45"} h-3 w-3 border-l border-b ${bubbleBorder} ${bubbleBg}`}
        />
        <article
          className={`rounded-2xl border ${bubbleBorder} ${bubbleBg} ${padding} shadow-[0_10px_24px_rgba(10,16,28,0.2)] ${isBottom ? "text-center" : ""}`}
        >
          <p className={`${titleSize} uppercase tracking-[0.18em] ${bubbleTitle}`}>AI Narrator</p>
          <div className={`mt-1 flex flex-wrap items-center gap-2 ${isBottom ? "justify-center" : ""}`}>
            <p className={`${textSize} font-semibold ${bubbleText}`}>{name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${badgeBg} ${badgeText}`}>
              {roleLabel(style)}
            </span>
          </div>
          <p className={`mt-2 ${textSize} ${leading} ${bubbleText}`}>{message}</p>
        </article>
      </div>
    </div>
  );
}
