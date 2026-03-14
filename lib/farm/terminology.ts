export const FARM_KNOWLEDGE_STORAGE_KEY = "mind-ai:farm-knowledge-seen";
export const FARM_CERTIFICATE_STORAGE_KEY = "mind-ai:farm-certificate";

export const FARM_METAPHOR_LABELS = {
  teaching: "教小麦认东西",
  textbook: "教材",
  practiceSet: "练习题",
  answerSticker: "答案贴纸",
  brain: "小麦的大脑",
  mistakeIndex: "犯错指数",
  confusionLevel: "迷糊程度",
  judgmentPower: "判断力",
  answerRate: "答对率",
  overfit: "死记硬背",
  underfit: "还没学够",
  reviewRounds: "复习轮数",
  guess: "小麦的猜测",
  textbookReadiness: "教材准备度",
  reviewCheck: "检查答对率",
  graduationTest: "毕业考",
} as const;

export interface FarmKnowledgeCard {
  kidTerm: string;
  realTerm: string;
  title: string;
  description: string;
}

export interface FarmCertificateSnapshot {
  playerName: string;
  levelName: string;
  answerRate: number;
  completedAt: string;
}

export const FARM_KNOWLEDGE_CARDS: FarmKnowledgeCard[] = [
  {
    kidTerm: "教小麦认东西",
    realTerm: "监督学习",
    title: "原来刚才是在教小麦认东西",
    description: "你先给小麦看样本，再告诉它哪些是对的，这就是让机器跟着答案学习。",
  },
  {
    kidTerm: "教材 / 练习题",
    realTerm: "训练数据",
    title: "小麦先要有题目可看",
    description: "你挑出来的那些稻子样本，就是小麦反复练习时会看到的题目和教材。",
  },
  {
    kidTerm: "答案贴纸",
    realTerm: "标签 Label",
    title: "贴纸其实就是标准答案",
    description: "你给每株稻子贴上的健康或不健康贴纸，会告诉小麦这题到底该怎么答。",
  },
  {
    kidTerm: "小麦的大脑",
    realTerm: "模型",
    title: "小麦靠这个大脑来做判断",
    description: "你教出来的判断规则，会慢慢装进小麦的大脑里，让它学会自己分辨。",
  },
  {
    kidTerm: "犯错指数 / 迷糊程度",
    realTerm: "Loss / 损失函数",
    title: "这条线是在看小麦还糊不糊涂",
    description: "数值越低，说明小麦越不容易犯错；数值越高，说明它还需要再多复习。",
  },
  {
    kidTerm: "判断力 / 经验值",
    realTerm: "权重 Weight",
    title: "小麦会把经验分给不同线索",
    description: "有些线索更重要，小麦就会更认真地记住它们，这些记忆分配就是它的判断力。",
  },
  {
    kidTerm: "答对率",
    realTerm: "准确率",
    title: "答对率就是小麦一共答对了多少",
    description: "你在测验田和考试田看到的百分比，就是它答对题目的比例。",
  },
  {
    kidTerm: "死记硬背 / 还没学够",
    realTerm: "过拟合 / 欠拟合",
    title: "学太死和学不够都不行",
    description: "如果小麦只会背旧题，就是死记硬背；如果它连基本规律都没学会，就是还没学够。",
  },
  {
    kidTerm: "复习轮数",
    realTerm: "Epoch",
    title: "同一批题目要看很多轮",
    description: "每复习一轮，小麦都会再看一次教材，慢慢把判断方法记牢。",
  },
  {
    kidTerm: "小麦的猜测",
    realTerm: "预测",
    title: "猜测就是小麦自己给出的答案",
    description: "当你让小麦去看一株新稻子时，它会先自己猜，这个猜出来的结果就是预测。",
  },
];
