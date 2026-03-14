"use client";

import { useState, useEffect } from "react";

/**
 * useMobile hook
 * 
 * 自动判断当前设备是手机还是电脑（通过 window.innerWidth < 768 判断）
 * 监听 window resize 事件，窗口大小变化时实时更新
 * 返回 isMobile (boolean) 和 windowWidth (number)
 */
export function useMobile() {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  useEffect(() => {
    // 函数体：处理窗口大小变化
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      setIsMobile(currentWidth < 768);
    };

    // 初始设置
    handleResize();

    // 监听 resize 事件
    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isMobile,
    windowWidth,
  };
}

export default useMobile;
