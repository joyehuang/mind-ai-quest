export const FARM_PROLOGUE_STORAGE_KEY = "mind-ai:farm-prologue-seen";

export type FarmPrologueTone = "gold" | "alert" | "plea" | "hero" | "growth" | "cta";

export interface FarmProloguePanel {
  id: string;
  eyebrow: string;
  title: string;
  narration: string;
  aside: string;
  bubble?: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: string;
  supportImages: string[];
  keywords: string[];
  durationMs: number;
  tone: FarmPrologueTone;
  summarySteps?: string[];
}

export function createFarmProloguePanels(playerName: string): FarmProloguePanel[] {
  const teacherName = playerName.trim() || "你";

  return [
    {
      id: "harvest",
      eyebrow: "第 1 幕",
      title: "金黄稻田",
      narration: "这是小麦家的稻田，今年收成看起来很棒！",
      aside:
        "阳光落在稻穗上，整片田像一张会发光的金色地图。中国是世界上最大的水稻生产国，也就是说，我们每天吃到的香香米饭，很多都和这样的稻田有关。保护庄稼、爱护农田，是大家都重要的事。",
      bubble: "希望这片稻田一直都健健康康的。",
      imageSrc: "/images_game-bg.png",
      imageAlt: "金色稻田",
      imagePosition: "center 58%",
      supportImages: ["/images_a1.png", "/images_a8.png"],
      keywords: ["丰收", "米饭", "保护"],
      durationMs: 6000,
      tone: "gold",
    },
    {
      id: "intrusion",
      eyebrow: "第 2 幕",
      title: "害虫杂草入侵",
      narration: "害虫和杂草混进了稻田，小麦分不清谁好谁坏……",
      aside: "看上去都长在田里，但有些会偷走养分，有些还会让病害更快扩散。",
      bubble: "它们都长得像稻子，可感觉哪里不对。",
      imageSrc: "/images_game-bg.png",
      imageAlt: "被害虫和杂草干扰的稻田",
      imagePosition: "center 52%",
      supportImages: ["/images_a6.png", "/images_a11.png", "/images_a14.png"],
      keywords: ["混入", "干扰", "风险"],
      durationMs: 6000,
      tone: "alert",
    },
    {
      id: "help",
      eyebrow: "第 3 幕",
      title: "小麦开始求助",
      narration: "要是有人能教我分辨就好了！",
      aside: "小麦知道，靠猜是不行的。想保护稻田，得先学会观察和判断。",
      bubble: "我想把坏家伙找出来，可我还不会分。",
      imageSrc: "/images_a3.png",
      imageAlt: "需要帮助的稻田样本",
      imagePosition: "center center",
      supportImages: ["/images_a2.png", "/images_a5.png"],
      keywords: ["求助", "学习", "观察"],
      durationMs: 6000,
      tone: "plea",
    },
    {
      id: "teacher",
      eyebrow: "第 4 幕",
      title: "玩家登场",
      narration: "你就是小麦的老师！",
      aside: `${teacherName} 会带着小麦一起看样本、做判断，再把经验慢慢讲给小麦听。`,
      bubble: `${teacherName}，你愿意来当小麦的老师吗？`,
      imageSrc: "/images_a10.png",
      imageAlt: "等待老师帮助的稻田任务",
      imagePosition: "center 42%",
      supportImages: ["/images_a7.png", "/images_a9.png"],
      keywords: ["老师", "带领", "判断"],
      durationMs: 6000,
      tone: "hero",
    },
    {
      id: "gameplay",
      eyebrow: "第 5 幕",
      title: "玩法一句话总结",
      narration: "帮助小麦判断稻子好坏  → 小麦越来越聪明 → 稻田变得越来越好！",
      aside: "先看样本、再帮小麦记住办法、最后检查它有没有真的学会。",
      bubble: "每多学会一次，小麦都会更会照顾稻田一点。",
      imageSrc: "/images_a12.png",
      imageAlt: "用于学习和判断的稻田样本",
      imagePosition: "center 35%",
      supportImages: ["/images_a4.png", "/images_a13.png"],
      keywords: ["观察", "记住", "成长"],
      durationMs: 6500,
      tone: "growth",
      summarySteps: ["判断稻子好坏", "小麦越来越聪明", "稻田越来越好"],
    },
    {
      id: "start",
      eyebrow: "第 6 幕",
      title: "出发吧，老师",
      narration: "开始教小麦！",
      aside: "第一块田已经准备好了。先挑教材，再一步步把分辨方法讲给小麦听。",
      bubble: `${teacherName}老师，第一课就从这片田开始。`,
      imageSrc: "/images_game-bg.png",
      imageAlt: "准备开始教学的稻田",
      imagePosition: "center 55%",
      supportImages: ["/images_a15.png", "/images_a1.png"],
      keywords: ["准备", "教材", "出发"],
      durationMs: 6500,
      tone: "cta",
    },
  ];
}
