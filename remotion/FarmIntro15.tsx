import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
} from "remotion";

// 总时长: 15秒 @ 30fps = 450帧
const TOTAL_DURATION = 450;
const FPS = 30;

// 各幕时间轴 (单位: 帧)
const TIMING = {
  scene1: { start: 0, end: 75 },      // 0-2.5s: 金黄稻田
  scene2: { start: 75, end: 150 },    // 2.5-5s: 害虫入侵
  scene3: { start: 150, end: 225 },   // 5-7.5s: 小麦求助
  scene4: { start: 225, end: 300 },   // 7.5-10s: 玩家登场
  scene5: { start: 300, end: 375 },   // 10-12.5s: 玩法演示
  scene6: { start: 375, end: 450 },   // 12.5-15s: 出发号召
};

// 主题色彩配置
const THEMES = {
  gold: {
    primary: "#F4D03F",
    secondary: "#F39C12",
    text: "#5D4037",
    bg: "radial-gradient(circle at 50% 40%, #fff7d1 0%, #f4d03f 40%, #d68910 100%)",
  },
  alert: {
    primary: "#E74C3C",
    secondary: "#C0392B",
    text: "#FFFFFF",
    bg: "radial-gradient(circle at 50% 40%, #fde5c7 0%, #e74c3c 40%, #641e16 100%)",
  },
  plea: {
    primary: "#F39C12",
    secondary: "#E67E22",
    text: "#5D4037",
    bg: "radial-gradient(circle at 50% 40%, #fff3dc 0%, #f39c12 40%, #d68910 100%)",
  },
  hero: {
    primary: "#3498DB",
    secondary: "#2980B9",
    text: "#FFFFFF",
    bg: "radial-gradient(circle at 50% 40%, #e8f4fc 0%, #3498db 40%, #1a5276 100%)",
  },
  growth: {
    primary: "#27AE60",
    secondary: "#229954",
    text: "#FFFFFF",
    bg: "radial-gradient(circle at 50% 40%, #eafaf1 0%, #27ae60 40%, #1e8449 100%)",
  },
  cta: {
    primary: "#27AE60",
    secondary: "#F4D03F",
    text: "#FFFFFF",
    bg: "radial-gradient(circle at 50% 40%, #fff9e6 0%, #27ae60 40%, #196f3d 100%)",
  },
};

// 场景1: 金黄稻田
const Scene1Harvest = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const floatY = Math.sin((frame / fps) * Math.PI * 2) * 10;
  const textOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: THEMES.gold.bg }}>
      {/* 背景图 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 50%",
          opacity,
          transform: `translateY(${floatY}px)`,
        }}
      />

      {/* 温暖光晕 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)",
        }}
      />

      {/* 文字叠加 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${interpolate(frame, [40, 60], [0.8, 1], { extrapolateRight: "clamp" })})`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: THEMES.gold.text,
              margin: 0,
              textShadow: "0 8px 30px rgba(0,0,0,0.3)",
              letterSpacing: 4,
            }}
          >
            丰收的季节
          </h1>
          <div
            style={{
              fontSize: 32,
              color: THEMES.gold.text,
              marginTop: 20,
              fontWeight: 600,
            }}
          >
            金黄的稻田，沉甸甸的希望
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 场景2: 害虫入侵
const Scene2Intrusion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - TIMING.scene2.start;

  const bgOpacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const redFlash = interpolate(
    localFrame,
    [0, 10, 20, 30],
    [0, 0.4, 0.2, 0],
    { extrapolateRight: "clamp" }
  );
  const shake = Math.sin(localFrame * 0.8) * (8 * interpolate(localFrame, [0, 20], [1, 0], { extrapolateRight: "clamp" }));
  const textScale = spring({ frame: localFrame - 15, fps, config: { damping: 80, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ background: THEMES.alert.bg }}>
      {/* 背景变暗 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 50%",
          filter: "brightness(0.4) saturate(0.7)",
          opacity: bgOpacity,
        }}
      />

      {/* 红色警告闪光 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(231, 76, 60, ${redFlash})`,
        }}
      />

      {/* 害虫图标从两侧滑入 */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: `${interpolate(localFrame, [0, 30], [-100, 25], { extrapolateRight: "clamp" })}%`,
          transform: `translateX(-50%)`,
        }}
      >
        <Img src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/images_a6.png")} style={{ width: 200, height: 200 }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: `${interpolate(localFrame, [0, 30], [-100, 20], { extrapolateRight: "clamp" })}%`,
          transform: `translateX(50%)`,
        }}
      >
        <Img src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/images_a11.png")} style={{ width: 180, height: 180 }} />
      </div>

      {/* 警告文字 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `translateX(${shake}px) scale(${Math.min(textScale, 1)})`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: 0,
              textShadow: "0 0 40px rgba(231, 76, 60, 0.8)",
              letterSpacing: 6,
            }}
          >
            害虫来了！
          </h1>
          <div
            style={{
              fontSize: 28,
              color: "#FFFFFF",
              marginTop: 20,
              fontWeight: 600,
            }}
          >
            稻田正在被入侵...
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 场景3: 小麦求助
const Scene3Help = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - TIMING.scene3.start;

  const fadeIn = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const bubbleScale = spring({ frame: localFrame - 10, fps, config: { damping: 100, stiffness: 150 } });
  const sway = Math.sin((localFrame / fps) * Math.PI * 0.8) * 5;
  const questionBounce = spring({ frame: localFrame - 25, fps, config: { damping: 70, stiffness: 300 } });

  return (
    <AbsoluteFill style={{ background: THEMES.plea.bg }}>
      {/* 背景图 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/images_a3.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeIn,
        }}
      />

      {/* 小麦角色 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `translateX(${sway}px) rotate(${sway * 0.5}deg)`,
            textAlign: "center",
          }}
        >
          {/* 对话气泡 */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 30,
              padding: "30px 50px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              transform: `scale(${Math.min(bubbleScale, 1)}) translateY(${-100 + Math.min(questionBounce, 1) * 20}px)`,
              marginBottom: 30,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: THEMES.plea.text,
              }}
            >
              谁来帮帮我？
            </div>
          </div>

          {/* 问号 */}
          <div
            style={{
              display: "flex",
              gap: 15,
              marginTop: 20,
              opacity: interpolate(localFrame, [25, 40], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            {["?", "?", "?"].map((q, i) => (
              <div
                key={i}
                style={{
                  fontSize: 50,
                  color: THEMES.plea.primary,
                  transform: `translateY(${Math.sin((localFrame - 25 + i * 5) * 0.1) * 10}px)`,
                }}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 场景4: 玩家登场
const Scene4Hero = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - TIMING.scene4.start;

  const lightRadius = interpolate(localFrame, [0, 40], [0, 150], { extrapolateRight: "clamp" });
  const lightOpacity = interpolate(localFrame, [0, 30, 60], [0, 1, 0.6], { extrapolateRight: "clamp" });
  const textScale = spring({ frame: localFrame - 20, fps, config: { damping: 80, stiffness: 120 } });
  const particleCount = 8;

  return (
    <AbsoluteFill style={{ background: THEMES.hero.bg }}>
      {/* 背景图 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/images_a10.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.5)",
        }}
      />

      {/* 光芒效果 */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lightRadius * 3,
          height: lightRadius * 4,
          background: `radial-gradient(ellipse, rgba(255,255,255,${lightOpacity}) 0%, transparent 70%)`,
        }}
      />

      {/* 粒子 */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = interpolate(localFrame, [20, 50], [0, 80], { extrapolateRight: "clamp" });
        const particleX = Math.cos(angle) * distance;
        const particleY = Math.sin(angle) * distance;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "35%",
              left: "50%",
              width: 12,
              height: 12,
              background: "white",
              borderRadius: "50%",
              transform: `translate(${particleX}px, ${particleY}px)`,
              opacity: interpolate(localFrame, [20, 30, 50], [0, 1, 0], { extrapolateRight: "clamp" }),
            }}
          />
        );
      })}

      {/* 文字 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${Math.min(textScale, 1)})`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: 0,
              textShadow: "0 0 30px rgba(52, 152, 219, 0.8)",
            }}
          >
            你就是小麦的老师！
          </h1>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 场景5: 玩法演示
const Scene5Gameplay = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - TIMING.scene5.start;

  const steps = [
    { icon: "👀", text: "观察稻子", delay: 0 },
    { icon: "🧠", text: "帮助判断", delay: 15 },
    { icon: "🌾", text: "小麦成长", delay: 30 },
  ];

  return (
    <AbsoluteFill style={{ background: THEMES.growth.bg }}>
      {/* 背景图 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/images_a12.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.3,
        }}
      />

      {/* 流程卡片 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          {steps.map((step, i) => {
            const cardDelay = step.delay;
            const cardScale = spring({ frame: localFrame - cardDelay - 5, fps, config: { damping: 90, stiffness: 180 } });
            const cardOpacity = interpolate(localFrame, [cardDelay, cardDelay + 15], [0, 1], { extrapolateRight: "clamp" });

            return (
              <div key={i}>
                {/* 卡片 */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: 24,
                    padding: "35px 45px",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
                    transform: `scale(${Math.min(cardScale, 1)})`,
                    opacity: cardOpacity,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 60 }}>{step.icon}</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: THEMES.growth.text,
                      marginTop: 10,
                    }}
                  >
                    {step.text}
                  </div>
                </div>

                {/* 箭头 */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: -30,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 40,
                      color: "white",
                      opacity: interpolate(localFrame, [cardDelay + 20, cardDelay + 35], [0, 1], { extrapolateRight: "clamp" }),
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部总结 */}
        <div
          style={{
            position: "absolute",
            bottom: 120,
            fontSize: 32,
            fontWeight: 700,
            color: "white",
            opacity: interpolate(localFrame, [50, 65], [0, 1], { extrapolateRight: "clamp" }),
            textShadow: "0 4px 15px rgba(0,0,0,0.3)",
          }}
        >
          稻田越来越好！
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 场景6: 出发号召 (CTA)
const Scene6CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - TIMING.scene6.start;

  const fadeIn = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const buttonScale = spring({ frame: localFrame - 15, fps, config: { damping: 70, stiffness: 80 } });
  const buttonPulse = 1 + Math.sin((localFrame / fps) * Math.PI * 4) * 0.03;
  const logoScale = spring({ frame: localFrame - 10, fps, config: { damping: 80, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ background: THEMES.cta.bg }}>
      {/* 背景图 */}
      <Img
        src={staticFile("https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeIn * 0.4,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Logo/标题 */}
        <div
          style={{
            transform: `scale(${Math.min(logoScale, 1)})`,
            textAlign: "center",
            marginBottom: 50,
          }}
        >
          <h1
            style={{
              fontSize: 70,
              fontWeight: 900,
              color: "white",
              margin: 0,
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            🌾 AI 农场
          </h1>
        </div>

        {/* CTA 按钮 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 60,
            padding: "35px 80px",
            boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
            transform: `scale(${Math.min(buttonScale, 1) * buttonPulse})`,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${THEMES.cta.primary} 0%, ${THEMES.cta.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: 2,
            }}
          >
            开始教小麦！
          </div>
        </div>

        {/* 副标题 */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            marginTop: 40,
            opacity: interpolate(localFrame, [30, 45], [0, 1], { extrapolateRight: "clamp" }),
            fontWeight: 500,
          }}
        >
          第一课就从这片田开始
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 主组件 - 15秒开场动画
export const FarmIntro15 = ({ playerName = "你" }: { playerName?: string }) => {
  const frame = useCurrentFrame();

  // 根据当前帧渲染对应场景
  const renderScene = () => {
    if (frame < TIMING.scene1.end) return <Scene1Harvest />;
    if (frame < TIMING.scene2.end) return <Scene2Intrusion />;
    if (frame < TIMING.scene3.end) return <Scene3Help />;
    if (frame < TIMING.scene4.end) return <Scene4Hero />;
    if (frame < TIMING.scene5.end) return <Scene5Gameplay />;
    return <Scene6CTA />;
  };

  return (
    <AbsoluteFill style={{ background: "#1a1a1a" }}>
      {renderScene()}
    </AbsoluteFill>
  );
};

// 默认配置导出
export const compositionConfig = {
  durationInFrames: TOTAL_DURATION,
  fps: FPS,
  width: 1080,
  height: 1920, // 竖屏格式
  props: { playerName: "你" },
};

// 横屏版本配置
export const compositionConfigLandscape = {
  durationInFrames: TOTAL_DURATION,
  fps: FPS,
  width: 1920,
  height: 1080, // 横屏格式
  props: { playerName: "你" },
};
