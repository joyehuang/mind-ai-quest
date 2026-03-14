"use client";

import { useEffect, useState } from "react";

export function useOrientation() {
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    // 初始检测
    checkOrientation();

    // 监听屏幕方向变化
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    mediaQuery.addEventListener("change", checkOrientation);

    // 也监听 resize 事件以捕获所有变化
    window.addEventListener("resize", checkOrientation);

    return () => {
      mediaQuery.removeEventListener("change", checkOrientation);
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  return {
    isPortrait,
    isLandscape: isPortrait === null ? null : !isPortrait,
  };
}
