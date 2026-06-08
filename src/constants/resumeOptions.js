export const templates = [
  { label: "现代", value: "modern" },
  { label: "经典", value: "classic" },
  { label: "紧凑", value: "compact" }
];

export const layoutModes = [
  {
    label: "标准排版",
    value: "standard",
    style: {
      baseFontSize: 13,
      lineHeight: 1.62,
      sectionSpacing: 16,
      pageMarginX: 17,
      pageMarginY: 16
    }
  },
  {
    label: "紧凑排版",
    value: "dense",
    style: {
      baseFontSize: 12.5,
      lineHeight: 1.48,
      sectionSpacing: 11,
      pageMarginX: 15,
      pageMarginY: 13
    }
  },
  {
    label: "一页优先",
    value: "onePage",
    style: {
      baseFontSize: 12,
      lineHeight: 1.42,
      sectionSpacing: 9,
      pageMarginX: 13,
      pageMarginY: 10
    }
  },
  {
    label: "留白舒展",
    value: "spacious",
    style: {
      baseFontSize: 13.5,
      lineHeight: 1.75,
      sectionSpacing: 20,
      pageMarginX: 20,
      pageMarginY: 18
    }
  }
];

export const dateFormats = [
  { label: "2000年1月", value: "zh", sample: "2000年1月" },
  { label: "2000.1", value: "dot", sample: "2000.1" },
  { label: "2000-1", value: "dash", sample: "2000-1" },
  { label: "2000/1", value: "slash", sample: "2000/1" }
];

export const accents = [
  { label: "黑色", value: "#111827", soft: "#f3f4f6", border: "#9ca3af", dark: "#030712" },
  { label: "深灰", value: "#374151", soft: "#f5f6f8", border: "#b8c0cc", dark: "#1f2937" },
  { label: "青绿", value: "#0f766e", soft: "#e6f3f1", border: "#9bd0c8", dark: "#0b5d57" },
  { label: "蓝色", value: "#2563eb", soft: "#eaf1ff", border: "#b8cdfb", dark: "#1d4ed8" },
  { label: "深蓝", value: "#1e3a8a", soft: "#e9eefb", border: "#aebdea", dark: "#172554" },
  { label: "绿色", value: "#15803d", soft: "#e9f7ee", border: "#9dd6af", dark: "#166534" },
  { label: "紫色", value: "#7c3aed", soft: "#f1ebff", border: "#c9b5fb", dark: "#5b21b6" },
  { label: "琥珀", value: "#b45309", soft: "#fff3df", border: "#f0c177", dark: "#92400e" },
  { label: "玫红", value: "#be123c", soft: "#ffe8ee", border: "#f4a5b8", dark: "#9f1239" },
  { label: "红色", value: "#dc2626", soft: "#feecec", border: "#f5aaaa", dark: "#991b1b" }
];

export const fontOptions = [
  { label: "系统黑体", value: 'Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif' },
  { label: "微软雅黑", value: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif' },
  { label: "苹方 / 系统 UI", value: '"PingFang SC", "Segoe UI", "Microsoft YaHei", Arial, sans-serif' },
  { label: "思源黑体", value: '"Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif' },
  { label: "宋体正式", value: '"SimSun", "Songti SC", serif' },
  { label: "仿宋公文", value: '"FangSong", "FangSong_GB2312", "STFangsong", serif' },
  { label: "楷体", value: '"KaiTi", "STKaiti", serif' },
  { label: "Arial", value: 'Arial, "Microsoft YaHei", sans-serif' },
  { label: "Georgia", value: 'Georgia, "Times New Roman", "Songti SC", serif' },
  { label: "Times New Roman", value: '"Times New Roman", "Songti SC", serif' }
];

export const photoModes = [
  { label: "证件照", value: "id" },
  { label: "圆形", value: "round" },
  { label: "隐藏", value: "hidden" }
];

export const genderOptions = [
  { label: "不展示", value: "" },
  { label: "男", value: "男" },
  { label: "女", value: "女" }
];

export const politicalStatusOptions = [
  { label: "不展示", value: "" },
  { label: "中共党员", value: "中共党员" },
  { label: "中共预备党员", value: "中共预备党员" },
  { label: "共青团员", value: "共青团员" },
  { label: "群众", value: "群众" },
  { label: "民主党派", value: "民主党派" }
];

export const sectionTypeLabels = {
  summary: "个人优势",
  experience: "工作经历",
  projects: "项目经历",
  education: "教育经历",
  skills: "技能标签",
  custom: "自定义模块"
};

export const defaultGlobalStyle = {
  fontFamily: fontOptions[0].value,
  baseFontSize: 13,
  lineHeight: 1.62,
  sectionSpacing: 16,
  pageMarginX: 17,
  pageMarginY: 16
};

export const customModulePresets = [
  {
    label: "个人优势",
    value: "summarySection",
    title: "个人优势",
    sectionType: "summary",
    content: "在这里填写个人优势。"
  },
  {
    label: "工作经历",
    value: "experienceSection",
    title: "工作经历",
    sectionType: "experience",
    entry: {
      organization: "公司名称",
      title: "职位",
      location: "",
      major: "",
      degree: "",
      start: "",
      end: "present",
      details: "职责范围\n关键动作\n量化结果"
    }
  },
  {
    label: "项目经历",
    value: "projectSection",
    title: "项目经历",
    sectionType: "projects",
    entry: {
      organization: "项目名称",
      title: "项目角色",
      location: "",
      major: "",
      degree: "",
      start: "",
      end: "",
      details: "项目背景\n负责内容\n量化结果"
    }
  },
  {
    label: "教育经历",
    value: "educationSection",
    title: "教育经历",
    sectionType: "education",
    entry: {
      organization: "学校名称",
      title: "",
      location: "",
      major: "专业",
      degree: "学历",
      start: "",
      end: "",
      details: "课程、奖项或成绩"
    }
  },
  {
    label: "技能标签",
    value: "skillsSection",
    title: "技能标签",
    sectionType: "skills",
    skills: "技能一, 技能二, 技能三"
  },
  { label: "普通文本", value: "text", title: "自定义模块", content: "在这里填写模块内容。" },
  { label: "荣誉奖项", value: "honor", title: "荣誉奖项", content: "奖项名称｜获奖时间｜说明" },
  { label: "证书资质", value: "certificate", title: "证书资质", content: "证书名称｜获得时间｜颁发机构" },
  { label: "语言能力", value: "language", title: "语言能力", content: "英语 CET-6｜可作为工作语言" }
];
