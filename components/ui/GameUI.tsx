"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type PanelVariant = "soft" | "strong";
type ButtonVariant = "primary" | "secondary" | "success";
type BadgeVariant = "info" | "success" | "warning";

interface GamePanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  glow?: boolean;
}

export function GamePanel({ variant = "soft", glow = false, className, ...props }: GamePanelProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "game-panel-strong" : "game-panel",
        glow && "game-glow",
        "rounded-3xl",
        className,
      )}
      {...props}
    />
  );
}

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function GameButton({ variant = "secondary", className, ...props }: GameButtonProps) {
  const tone =
    variant === "primary"
      ? "game-button-primary"
      : variant === "success"
        ? "game-button-green"
        : "game-button-muted";

  return <button className={cn("game-button", tone, className)} {...props} />;
}

interface GameBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function GameBadge({ variant = "info", className, children, ...props }: GameBadgeProps) {
  const tone =
    variant === "success" ? "game-chip-green" : variant === "warning" ? "game-chip" : "game-chip-blue";

  return (
    <span className={cn(tone, "inline-flex rounded-full px-3 py-1 text-xs font-semibold", className)} {...props}>
      {children}
    </span>
  );
}

interface GameProgressProps {
  value: number;
  className?: string;
}

export function GameProgress({ value, className }: GameProgressProps) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("game-progress-track h-3", className)}>
      <div className="game-progress-fill h-full" style={{ width: `${safe}%` }} />
    </div>
  );
}

