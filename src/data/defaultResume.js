import { emptyStyleOverride } from "../utils/resumeHelpers";

export const defaultProfile = {
  name: "林予安",
  role: "产品运营 / 数据分析",
  phone: "138 0000 0000",
  email: "linyuan@example.com",
  location: "上海",
  gender: "",
  politicalStatus: "",
  website: "portfolio.example.com",
  photo: {
    dataUrl: "",
    mode: "id"
  }
};

export const defaultSections = [
  {
    id: "summary",
    type: "summary",
    title: "个人优势",
    content:
      "3 年互联网产品运营经验，擅长用户增长、活动策划与数据分析。能够从业务目标拆解指标体系，推动跨团队协作，并通过实验和复盘持续提升转化效率。",
    skills: "",
    entries: [],
    styleOverride: emptyStyleOverride(),
    settingsOpen: false
  },
  {
    id: "experience",
    type: "experience",
    title: "工作经历",
    content: "",
    skills: "",
    entries: [
      {
        organization: "星河科技",
        title: "产品运营",
        location: "上海",
        major: "",
        degree: "",
        start: "2023-03",
        end: "present",
        details:
          "负责新用户转化链路，梳理注册、激活、首购关键节点。\n搭建周度数据看板，定位流失环节并推动产品优化，激活率提升 18%。\n策划会员增长活动，联动设计、渠道和客服团队，活动 ROI 达 2.4。"
      },
      {
        organization: "云杉互动",
        title: "运营专员",
        location: "杭州",
        major: "",
        degree: "",
        start: "2021-07",
        end: "2023-02",
        details:
          "维护社群与内容矩阵，月均输出 20+ 篇运营内容。\n完成用户分层和召回策略，沉睡用户回访转化率提升 12%。"
      }
    ],
    styleOverride: emptyStyleOverride(),
    settingsOpen: false
  },
  {
    id: "projects",
    type: "projects",
    title: "项目经历",
    content: "",
    skills: "",
    entries: [
      {
        organization: "新用户首单转化专项",
        title: "项目负责人",
        location: "上海",
        major: "",
        degree: "",
        start: "2024-04",
        end: "2024-07",
        details:
          "通过漏斗分析拆解首单路径，提出优惠券触达、页面信息精简和客服话术优化方案。\n上线后首单转化率从 9.6% 提升至 13.1%，新增月流水约 46 万元。"
      }
    ],
    styleOverride: emptyStyleOverride(),
    settingsOpen: false
  },
  {
    id: "education",
    type: "education",
    title: "教育经历",
    content: "",
    skills: "",
    entries: [
      {
        organization: "华东师范大学",
        title: "",
        location: "上海",
        major: "信息管理与信息系统",
        degree: "管理学学士",
        start: "2017-09",
        end: "2021-06",
        details: "GPA 3.7/4.0；校级优秀毕业生；主修统计学、数据库、管理信息系统。"
      }
    ],
    styleOverride: emptyStyleOverride(),
    settingsOpen: false
  },
  {
    id: "skills",
    type: "skills",
    title: "技能标签",
    content: "",
    skills: "用户增长, 活动运营, SQL, Excel, 数据看板, A/B 测试, 用户访谈, 文案策划",
    entries: [],
    styleOverride: emptyStyleOverride(),
    settingsOpen: false
  }
];
