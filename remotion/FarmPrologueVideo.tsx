import React from "react";
import {
  AbsoluteFill,
  Img,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// 场景配置数据
const SCENES = [
  {
    id: "harvest",
    title: "金黄稻田",
    eyebrow: "第 1 幕",
    narration: "这是小麦家的稻田，今年收成看起来很棒！",
    aside: "阳光落在稻穗上，整片田像一张会发光的金色地图。中国是世界上最大的水稻生产国，保护庄稼、爱护农田，是大家都重要的事。",
    bubble: "希望这片稻田一直都健健康康的。",
    image: "https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp",
    imagePosition: "center 58%",
    keywords: ["丰收", "米饭", "保护"],
    duration: 180, // 6秒 @ 30fps
    tone: "gold",
  },
  {
    id: "intrusion",
    title: "害虫杂草入侵",
    eyebrow: "第 2 幕",
    narration: "害虫和杂草混进了稻田，小麦分不清谁好谁坏……",
    aside: "看上去都长在田里，但有些会偷走养分，有些还会让病害更快扩散。",
    bubble: "它们都长得像稻子，可感觉哪里不对。",
    image: "https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp",
    imagePosition: "center 52%",
    keywords: ["混入", "干扰", "风险"],
    duration: 180,
    tone: "alert",
  },
  {
    id: "help",
    title: "小麦开始求助",
    eyebrow: "第 3 幕",
    narration: "要是有人能教我分辨就好了！",
    aside: "小麦知道，靠猜是不行的。想保护稻田，得先学会观察和判断。",
    bubble: "我想把坏家伙找出来，可我还不会分。",
    image: "https://bear-public.tos-cn-shanghai.volces.com/images_a3.png",
    imagePosition: "center center",
    keywords: ["求助", "学习", "观察"],
    duration: 180,
    tone: "plea",
  },
  {
    id: "teacher",
    title: "玩家登场",
    eyebrow: "第 4 幕",
    narration: "你就是小麦的老师！",
    aside: "老师会带着小麦一起看样本、做判断，再把经验慢慢讲给小麦听。",
    bubble: "你愿意来当小麦的老师吗？",
    image: "https://bear-public.tos-cn-shanghai.volces.com/images_a10.png",
    imagePosition: "center 42%",
    keywords: ["老师", "带领", "判断"],
    duration: 180,
    tone: "hero",
  },
  {
    id: "gameplay",
    title: "玩法一句话总结",
    eyebrow: "第 5 幕",
    narration: "帮助小麦判断稻子好坏 → 小麦越来越聪明 → 稻田变得越来越好！",
    aside: "先看样本、再帮小麦记住办法、最后检查它有没有真的学会。",
    bubble: "每多学会一次，小麦都会更会照顾稻田一点。",
    image: "https://bear-public.tos-cn-shanghai.volces.com/images_a12.png",
    imagePosition: "center 35%",
    keywords: ["观察", "记住", "成长"],
    duration: 195, // 6.5秒
    tone: "growth",
  },
  {
    id: "start",
    title: "出发吧，老师",
    eyebrow: "第 6 幕",
    narration: "开始教小麦！",
    aside: "练习田已经准备好了。先挑教材，再一步步把分辨方法讲给小麦听。",
    bubble: "老师，第一课就从这片田开始。",
    image: "https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp",
    imagePosition: "center 55%",
    keywords: ["准备", "教材", "出发"],
    duration: 195, // 6.5秒
    tone: "cta",
  },
];

// 主题样式
const TONES = {
  gold: {
    backdrop: "radial-gradient(circle at 18% 18%, #fff7d1 0%, #efcb6d 28%, #7b5618 100%)",
    primary: "#d8ae64",
    text: "#57370a",
  },
  alert: {
    backdrop: "radial-gradient(circle at 16% 16%, #fde5c7 0%, #d9854e 26%, #411911 100%)",
    primary: "#f2a165",
    text: "#602213",
  },
  plea: {
    backdrop: "radial-gradient(circle at 18% 16%, #fff3dc 0%, #d7b997 28%, #4c3521 100%)",
    primary: "#e7c28b",
    text: "#5b3c18",
  },
  hero: {
    backdrop: "radial-gradient(circle at 18% 16%, #fff1cd 0%, #d0b3ff 20%, #2c325f 100%)",
    primary: "#d7c0ff",
    text: "#3b2f67",
  },
  growth: {
    backdrop: "radial-gradient(circle at 18% 16%, #eef7d4 0%, #8dc67d 24%, #1c4f38 100%)",
    primary: "#a8dc92",
    text: "#274c2e",
  },
  cta: {
    backdrop: "radial-gradient(circle at 18% 16%, #fff0c7 0%, #77d49c 20%, #12382c 100%)",
    primary: "#8fe7b1",
    text: "#1f4f37",
  },
};

// 文字动画组件
const AnimatedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [delay, delay + 15, delay + 15 + 180],
    [0, 1, 1],
    { extrapolateRight: "clamp" }
  );

  const translateY = spring({
    frame: frame - delay,
    fps,
    config: { damping: 100, stiffness: 50 },
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${20 * (1 - Math.min(translateY, 1))}px)`,
      }}
    >
      {children}
    </div>
  );
};

// 场景组件
const Scene = ({ scene, playerName }: { scene: typeof SCENES[0]; playerName: string }) => {
  const tone = TONES[scene.tone as keyof typeof TONES];
  const frame = useCurrentFrame();

  // 气泡框动画
  const bubbleScale = spring({
    frame: frame - 30,
    fps: 30,
    config: { damping: 80, stiffness: 100 },
  });

  // 关键词淡入
  const keywordOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: tone.backdrop }}>
      {/* 背景图片 */}
      <Img
        src={staticFile(scene.image)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectPosition: scene.imagePosition,
          objectFit: "cover",
        }}
      />

      {/* 遮罩层 */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(20,14,8,0.04) 0%, rgba(20,14,8,0.14) 40%, rgba(14,9,6,0.7) 100%)",
        }}
      />

      {/* 内容 */}
      <AbsoluteFill style={{ padding: 80, display: "flex", flexDirection: "column" }}>
        {/* 顶部标签 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <AnimatedText delay={15}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                padding: "12px 32px",
                borderRadius: 100,
                color: tone.text,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {scene.eyebrow}
            </div>
          </AnimatedText>
        </div>

        {/* 底部内容 */}
        <div style={{ marginTop: "auto", maxWidth: 1000 }}>
          {/* 关键词 */}
          <AnimatedText delay={45}>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 32,
                opacity: keywordOpacity,
              }}
            >
              {scene.keywords.map((keyword, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.3)",
                    padding: "10px 24px",
                    borderRadius: 100,
                    color: "white",
                    fontSize: 16,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {keyword}
                </div>
              ))}
            </div>
          </AnimatedText>

          {/* 对话气泡 */}
          <AnimatedText delay={30}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 40,
                padding: "48px 56px",
                boxShadow: "0 24px 50px rgba(14,8,5,0.24)",
                transform: `scale(${bubbleScale})`,
                transformOrigin: "bottom left",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: `${tone.text}aa`,
                  marginBottom: 16,
                }}
              >
                Story Beat
              </div>
              <h2
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: tone.text,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {scene.title}
              </h2>
              <p
                style={{
                  fontSize: 28,
                  color: tone.text,
                  marginTop: 24,
                  lineHeight: 1.5,
                }}
              >
                {scene.narration}
              </p>
              <p
                style={{
                  fontSize: 22,
                  color: `${tone.text}cc`,
                  marginTop: 20,
                  lineHeight: 1.6,
                }}
              >
                {scene.aside}
              </p>
              {scene.bubble && (
                <div
                  style={{
                    marginTop: 32,
                    display: "inline-block",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    padding: "20px 32px",
                    borderRadius: 28,
                    fontSize: 20,
                    fontWeight: 500,
                    color: tone.text,
                    border: `1px solid ${tone.text}33`,
                  }}
                >
                  "{scene.bubble}"
                </div>
              )}
            </div>
          </AnimatedText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 主视频组件
export const FarmPrologueVideo = ({ playerName }: { playerName: string }) => {
  const transitionDuration = 30; // 1秒过渡

  return (
    <TransitionSeries>
      {SCENES.map((scene, index) => (
        <TransitionSeries.Sequence
          key={scene.id}
          durationInFrames={scene.duration}
        >
          <Scene scene={scene} playerName={playerName} />
        </TransitionSeries.Sequence>
      ))}
      {SCENES.slice(0, -1).map((_, index) => (
        <TransitionSeries.Transition
          key={`transition-${index}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
      ))}
    </TransitionSeries>
  );
};
