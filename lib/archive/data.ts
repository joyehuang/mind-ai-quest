import type { DaySensorPoint, MonitorPoint } from "./types";

const HISTORY_ANOMALY_DAYS = new Set([25, 28]);

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export const ARCHIVE_HISTORY: DaySensorPoint[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;

  const tiltBase = 0.74 + Math.sin(day / 4.2) * 0.04 + Math.cos(day / 6.8) * 0.02;
  const humidityBase = 64 + Math.sin(day / 3.3) * 5 + Math.cos(day / 8.4) * 2;
  const tempBase = 22 + Math.sin((day - 7) / 4.8) * 4.8 + Math.cos(day / 10.2) * 1.5;

  let tilt = tiltBase;
  let humidity = humidityBase;
  let temperature = tempBase;

  if (day === 5) {
    humidity += 9;
  }
  if (day === 15) {
    temperature += 5.2;
    humidity -= 3.2;
  }
  if (day === 25) {
    tilt += 0.56;
    humidity += 11;
  }
  if (day === 28) {
    tilt += 0.43;
    temperature += 4.2;
  }

  return {
    day,
    tilt: round(tilt),
    humidity: round(humidity),
    temperature: round(temperature),
    anomaly: HISTORY_ANOMALY_DAYS.has(day),
  };
});

export const MONITOR_SERIES: MonitorPoint[] = [
  { day: 1, tilt: 0.78, humidity: 66, temperature: 24, realAnomaly: false, deviation: 0.52 },
  { day: 2, tilt: 0.8, humidity: 67, temperature: 23.6, realAnomaly: false, deviation: 0.61 },
  { day: 3, tilt: 1.5, humidity: 76, temperature: 24.8, realAnomaly: true, deviation: 1.65 },
  { day: 4, tilt: 0.88, humidity: 68, temperature: 24.2, realAnomaly: false, deviation: 0.95 },
  { day: 5, tilt: 0.83, humidity: 69, temperature: 24, realAnomaly: false, deviation: 0.72 },
  { day: 6, tilt: 1.45, humidity: 74, temperature: 25.1, realAnomaly: true, deviation: 1.55 },
  { day: 7, tilt: 0.87, humidity: 67.5, temperature: 23.9, realAnomaly: false, deviation: 0.88 },
];

export const STEP_TITLES = [
  "认识健康日记",
  "建立正常基线",
  "AI学习中",
  "发现异常",
  "迭代优化",
] as const;

export const STEP1_GUIDE_LINES = [
  "文枢阁每天都会记录自己的健康日记。",
  "它会记录墙体倾斜、湿度和温度，就像人每天量体温。",
  "正常建筑会轻轻波动，不会突然乱跳。",
  "先和我看看过去30天的数据吧。",
] as const;

export const STEP2_GUIDE_LINES = [
  "现在要教AI什么是正常的文枢阁。",
  "选一段健康时期，AI就会学习这个模式。",
  "区间最好连续5到10天，太短就学不全。",
  "如果选到异常日，后面可能会频繁误报。",
] as const;

export const STEP4_GUIDE_LINES = [
  "现在监测最近7天，我会先自动报警。",
  "你需要帮我确认：是真的异常，还是误报。",
  "这一步会直接影响后面的优化判断。",
] as const;

export const INTRO_SCENES = [
  {
    durationMs: 2000,
    title: "守护文枢阁的每一天",
    subtitle: "江南古书院 · 白墙黛瓦 · 青石板",
    speech: "",
  },
  {
    durationMs: 3000,
    title: "守阁灵出现",
    subtitle: "Q版木构小机器人滑入",
    speech: "文枢阁最近有点不对劲！",
  },
  {
    durationMs: 3000,
    title: "传感器开始打卡",
    subtitle: "温湿度计 · 倾斜仪 · 裂缝计",
    speech: "它每天都会记录状态，但最近有些数据突然变了！",
  },
  {
    durationMs: 3000,
    title: "守阁灵陷入思考",
    subtitle: "眼睛转圈圈",
    speech: "我想帮忙发现异常，但我不知道什么是正常，你能教我吗？",
  },
  {
    durationMs: 2000,
    title: "帮AI学会认正常，守护百年老楼！",
    subtitle: "准备开始任务",
    speech: "",
  },
] as const;

export function dayNarration(day: number) {
  if (day === 5) {
    return "春天回南天，湿度高，墙体像在呼吸。";
  }
  if (day === 15) {
    return "大暑高温，木构件膨胀，缝隙会短暂变小。";
  }
  if (day === 25) {
    return "这天数据突然跳高，可能是异常信号。";
  }
  if (day === 28) {
    return "这里也有明显抖动，要谨慎纳入基线。";
  }
  return "这一天波动在常规范围内。";
}
