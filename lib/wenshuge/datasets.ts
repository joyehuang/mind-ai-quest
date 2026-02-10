import type { DetectionLabel, WenshugeDayRecord, WenshugeFeatureDefinition } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function seededNoise(day: number, seed: number) {
  const raw = Math.sin(day * 12.9898 + seed * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function wave(day: number, seed: number, amplitude: number) {
  return (seededNoise(day, seed) - 0.5) * 2 * amplitude;
}

export const WENSHUGE_FEATURES: WenshugeFeatureDefinition[] = [
  {
    key: "tiltAngle",
    label: "倾斜角度",
    unit: "°",
    isRelevant: true,
    description: "古楼整体倾斜趋势，结构风险的核心信号。",
  },
  {
    key: "wallWeathering",
    label: "墙面风化指数",
    unit: "%",
    isRelevant: true,
    description: "墙体粉化与剥落程度，长期损伤的重要线索。",
  },
  {
    key: "crackWidth",
    label: "裂缝宽度",
    unit: "mm",
    isRelevant: true,
    description: "结构裂缝变化速度，能直接反映破损演变。",
  },
  {
    key: "tileDropCount",
    label: "瓦片脱落数量",
    unit: "片",
    isRelevant: true,
    description: "屋面受损外显指标，通常与结构应力同向变化。",
  },
  {
    key: "moistureLevel",
    label: "木构含潮率",
    unit: "",
    isRelevant: true,
    description: "木构件受潮水平，长期偏高会放大病害风险。",
  },
  {
    key: "weekdayIndex",
    label: "星期几",
    unit: "",
    isRelevant: false,
    description: "日期编码，不直接决定文物结构是否异常。",
  },
  {
    key: "airTemperature",
    label: "环境温度",
    unit: "℃",
    isRelevant: false,
    description: "天气背景变量，短期变化不等于结构异常。",
  },
  {
    key: "visitorFlow",
    label: "游客流量",
    unit: "人",
    isRelevant: false,
    description: "运营强度指标，与破损趋势弱相关。",
  },
  {
    key: "festivalFlag",
    label: "节假日标记",
    unit: "",
    isRelevant: false,
    description: "日历因素，通常不直接描述建筑病害。",
  },
  {
    key: "guardShiftId",
    label: "值班编号",
    unit: "",
    isRelevant: false,
    description: "人员排班信息，与结构状态本身无关。",
  },
];

const ANOMALY_DAYS = new Set([9, 14, 23, 26, 29]);
const SENSOR_ERROR_DAYS = new Set([7, 16]);

function resolveNote(day: number, truth: DetectionLabel, sensorError: boolean) {
  if (sensorError && day === 7) {
    return "倾斜仪短时抖动，现场复测显示结构稳定。";
  }
  if (sensorError && day === 16) {
    return "风化传感器异常写入，疑似采集错误。";
  }
  if (truth === "anomaly" && day === 9) {
    return "风化指数与裂缝宽度同步抬升。";
  }
  if (truth === "anomaly" && day === 14) {
    return "倾斜角与含潮率出现同向跳变。";
  }
  if (truth === "anomaly" && day === 23) {
    return "瓦片脱落增加，墙体风化显著加快。";
  }
  if (truth === "anomaly" && day === 26) {
    return "倾斜角突然翻倍，伴随裂缝持续扩张。";
  }
  if (truth === "anomaly" && day === 29) {
    return "核心结构特征多项同时异常。";
  }
  const normalNotes = [
    "日常巡检，数据波动在常规范围内。",
    "轻微环境变化，结构指标整体平稳。",
    "常规维护后，指标未见异常漂移。",
    "连续晴天，数据曲线维持低幅波动。",
  ];
  return normalNotes[day % normalNotes.length];
}

function buildRecord(day: number): WenshugeDayRecord {
  const truth: DetectionLabel = ANOMALY_DAYS.has(day) ? "anomaly" : "normal";
  const sensorError = SENSOR_ERROR_DAYS.has(day);

  let tilt = 0.56 + 0.08 * Math.sin(day * 0.48) + wave(day, 11, 0.03);
  let weathering = 34 + 3.8 * Math.sin(day * 0.35 + 0.4) + wave(day, 17, 1.4);
  let crack = 1.1 + 0.28 * Math.sin(day * 0.41 + 0.9) + wave(day, 23, 0.15);
  let tileDrop = 2.2 + 0.9 * Math.sin(day * 0.38 + 0.2) + wave(day, 31, 0.45);
  let moisture = 0.36 + 0.06 * Math.sin(day * 0.33 + 1.2) + wave(day, 41, 0.03);

  if (truth === "anomaly") {
    tilt += 0.85 + wave(day, 81, 0.2);
    weathering += 18 + wave(day, 83, 4);
    crack += 2.4 + wave(day, 89, 0.5);
    tileDrop += 6 + wave(day, 97, 1.5);
    moisture += 0.23 + wave(day, 101, 0.05);
  }

  if (day === 26) {
    tilt += 0.45;
    crack += 0.5;
  }

  if (sensorError && day === 7) {
    tilt = 4.8;
    crack = 0.5;
    weathering = 33.2;
    tileDrop = 2;
    moisture = 0.39;
  }

  if (sensorError && day === 16) {
    tilt = 0.61;
    crack = 1.18;
    weathering = 123;
    tileDrop = 2;
    moisture = 1.28;
  }

  const weekday = ((day - 1) % 7) + 1;
  const temperature = 20 + 6 * Math.sin(day * 0.25 + 0.5) + wave(day, 53, 1.8);
  const visitorFlow = 180 + 95 * Math.sin(day * 0.42 + 0.8) + wave(day, 61, 45);
  const festivalFlag = day % 7 === 0 || day % 7 === 6 ? 1 : 0;
  const guardShiftId = 100 + ((day * 3) % 17) * 4 + wave(day, 71, 6);

  return {
    day,
    truth,
    sensorError,
    note: resolveNote(day, truth, sensorError),
    values: {
      tiltAngle: round(Math.max(0.08, tilt), 2),
      wallWeathering: round(Math.max(12, weathering), 1),
      crackWidth: round(Math.max(0.2, crack), 2),
      tileDropCount: Math.max(0, Math.round(tileDrop)),
      moistureLevel: round(clamp(moisture, 0.05, 1.35), 2),
      weekdayIndex: weekday,
      airTemperature: round(clamp(temperature, 8, 38), 1),
      visitorFlow: Math.max(40, Math.round(visitorFlow)),
      festivalFlag,
      guardShiftId: Math.max(70, Math.round(guardShiftId)),
    },
  };
}

export const WENSHUGE_RECORDS: WenshugeDayRecord[] = Array.from({ length: 30 }, (_, index) =>
  buildRecord(index + 1),
);

export const WENSHUGE_TRAIN_RECORDS = WENSHUGE_RECORDS.filter((record) => record.day <= 20);
export const WENSHUGE_TEST_RECORDS = WENSHUGE_RECORDS.filter((record) => record.day >= 21);
