import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const sectionDefinitions = [
  {
    type: "summary",
    title: "个人优势",
    aliases: ["个人优势", "个人简介", "个人总结", "自我评价", "职业概况", "profile", "summary"]
  },
  {
    type: "experience",
    title: "工作经历",
    aliases: ["工作经历", "工作经验", "任职经历", "实习经历", "职业经历", "experience", "work experience"]
  },
  {
    type: "projects",
    title: "项目经历",
    aliases: ["项目经历", "项目经验", "项目实践", "代表项目", "projects", "project experience"]
  },
  {
    type: "education",
    title: "教育经历",
    aliases: ["教育经历", "教育背景", "教育", "学历背景", "education"]
  },
  {
    type: "skills",
    title: "技能标签",
    aliases: ["技能", "专业技能", "技能标签", "技术栈", "skills", "technical skills"]
  }
];

const knownTitles = Object.fromEntries(sectionDefinitions.map((item) => [item.type, item.title]));
const extraCustomHeadings = [
  "荣誉奖项",
  "获奖经历",
  "证书",
  "资格证书",
  "语言能力",
  "校园经历",
  "社团经历",
  "发表论文",
  "作品集",
  "其他信息"
];

export async function readResumeFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    return {
      sourceType: "pdf",
      rawText: await extractPdfText(file)
    };
  }

  return {
    sourceType: "markdown",
    rawText: await file.text()
  };
}

async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = groupPdfItemsIntoRows(content.items);
    const pageText = rows.map(joinPdfRow).filter(Boolean).join("\n");
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n\n");
}

function groupPdfItemsIntoRows(items) {
  const rows = [];

  items
    .filter((item) => item.str && item.str.trim())
    .forEach((item) => {
      const [, , , , x, y] = item.transform;
      const row = rows.find((candidate) => Math.abs(candidate.y - y) <= 3);
      const normalized = {
        text: item.str.trim(),
        x,
        y,
        width: item.width || 0
      };

      if (row) {
        row.items.push(normalized);
        row.y = (row.y + y) / 2;
      } else {
        rows.push({ y, items: [normalized] });
      }
    });

  return rows.sort((a, b) => b.y - a.y);
}

function joinPdfRow(row) {
  const items = row.items.sort((a, b) => a.x - b.x);
  let line = "";
  let previousRight = null;

  items.forEach((item) => {
    const gap = previousRight === null ? 0 : item.x - previousRight;
    const needsSpace = gap > 4 && line && !/[（(《/，,。.;；:：、-]$/.test(line);
    line += `${needsSpace ? " " : ""}${item.text}`;
    previousRight = item.x + item.width;
  });

  return line.replace(/\s+/g, " ").trim();
}

export function parseResumeText(rawText) {
  const lines = normalizeLines(rawText);
  const warnings = [];

  if (!lines.length) {
    return {
      profile: emptyProfile(),
      sections: [],
      warnings: ["未读取到可解析文本。扫描件 PDF 暂不支持 OCR。"]
    };
  }

  const profile = parseProfile(lines);
  const bodyLines = removeLikelyProfileLines(lines, profile);
  const groupedSections = groupBySections(bodyLines);
  const sections = groupedSections.map(buildSection).filter(Boolean);

  if (!sections.length) {
    const fallbackLines = bodyLines.filter((line) => !isContactOnly(line)).slice(0, 8);
    if (fallbackLines.length) {
      sections.push({
        id: "summary",
        type: "summary",
        title: knownTitles.summary,
        content: fallbackLines.join("\n"),
        skills: "",
        entries: [],
        styleOverride: emptyStyleOverride()
      });
      warnings.push("未识别到清晰模块标题，已将主体内容放入个人优势。");
    }
  }

  if (!profile.name) {
    warnings.push("未识别到姓名，请在基本信息中补充。");
  }

  if (!profile.email && !profile.phone) {
    warnings.push("未识别到邮箱或电话，请在基本信息中补充。");
  }

  return { profile, sections, warnings };
}

export function normalizeDraft(draft) {
  return {
    profile: {
      ...emptyProfile(),
      ...(draft?.profile || {})
    },
    sections: Array.isArray(draft?.sections)
      ? draft.sections.map((section, index) => ({
          id: section.id || `${section.type || "section"}-${index}`,
          type: section.type || "custom",
          title: section.title || knownTitles[section.type] || "自定义模块",
          content: section.content || "",
          skills: section.skills || "",
          entries: Array.isArray(section.entries)
            ? section.entries.map((entry) => ({
                organization: entry.organization || "",
                title: entry.title || "",
                location: entry.location || "",
                major: entry.major || "",
                degree: entry.degree || "",
                start: entry.start || "",
                end: entry.end || "",
                details: entry.details || ""
              }))
            : [],
          styleOverride: {
            ...emptyStyleOverride(),
            ...(section.styleOverride || {})
          }
        }))
      : [],
    warnings: Array.isArray(draft?.warnings) ? draft.warnings : []
  };
}

function emptyProfile() {
  return {
    name: "",
    role: "",
    phone: "",
    email: "",
    location: "",
    gender: "",
    politicalStatus: "",
    website: ""
  };
}

function emptyStyleOverride() {
  return {
    fontSize: null,
    lineHeight: null,
    spacing: null
  };
}

function normalizeLines(rawText) {
  return String(rawText || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .flatMap((line) => line.split(/\s{4,}/))
    .map(cleanLine)
    .filter(Boolean);
}

function cleanLine(line) {
  return String(line || "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)、]\s*/, "")
    .replace(/[|｜]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseProfile(lines) {
  const joined = lines.join("\n");
  const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone =
    joined.match(/(?:\+?86[-\s]?)?(?:1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/)?.[0] ||
    "";
  const website =
    joined.match(/https?:\/\/[^\s]+/i)?.[0] ||
    joined.match(/\b(?:github|linkedin|portfolio|www)\.[^\s]+/i)?.[0] ||
    "";

  const firstSectionIndex = lines.findIndex((line) => Boolean(detectKnownSection(line)));
  const headLines = lines.slice(0, firstSectionIndex > -1 ? firstSectionIndex : Math.min(12, lines.length));
  const labeledName = findLabeledValue(headLines, /^(姓名|name)[:：\s]/i);
  const labeledRole = findLabeledValue(headLines, /^(求职意向|应聘岗位|目标岗位|职位|role)[:：\s]/i);
  const name = labeledName || findNameCandidate(headLines, { email, phone, website });
  const role = labeledRole || findRoleCandidate(headLines, name);

  return {
    name,
    role,
    phone,
    email,
    location: findLocationCandidate(headLines),
    website
  };
}

function findLabeledValue(lines, pattern) {
  const line = lines.find((item) => pattern.test(item));
  if (!line) return "";
  return line.replace(pattern, "").trim();
}

function findNameCandidate(lines, contact) {
  const inlineName = lines
    .map((line) => stripContact(line, contact))
    .map((line) => line.match(/^([\u4e00-\u9fa5]{2,4})(?:\s+|$)(.*)$/))
    .find((match) => match && (!match[2] || isRoleLike(match[2]) || match[2].length <= 12))?.[1];
  if (inlineName) return inlineName;

  const candidates = lines
    .map((line) => stripContact(line, contact))
    .flatMap(splitCompactHeader)
    .flatMap((line) => {
      const compactChinese = line.replace(/\s+/g, "");
      return /^[\u4e00-\u9fa5]{2,4}$/.test(compactChinese) ? [line, compactChinese] : [line];
    })
    .map((line) => line.replace(/个人简历|简历|resume/gi, "").trim())
    .filter(Boolean)
    .filter((line) => !detectKnownSection(line))
    .filter((line) => !isRoleLike(line))
    .filter((line) => !isContactOnly(line));

  return (
    candidates.find((line) => /^[\u4e00-\u9fa5]{2,4}(?:·[\u4e00-\u9fa5]{1,4})?$/.test(line)) ||
    candidates.find((line) => /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) ||
    candidates.find((line) => line.length >= 2 && line.length <= 16 && !/[0-9@:/\\]/.test(line)) ||
    ""
  );
}

function splitCompactHeader(line) {
  return String(line || "")
    .split(/\s{2,}|[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findRoleCandidate(lines, name) {
  const roleLine = lines
    .map((line) => line.replace(name, "").trim())
    .find((line) => isRoleLike(line) && !isContactOnly(line));
  if (!roleLine) return "";
  return stripContact(roleLine).replace(/^(求职意向|应聘岗位|目标岗位|职位)[:：\s]*/i, "").trim();
}

function isRoleLike(line) {
  return /(工程师|经理|主管|专员|运营|产品|设计|开发|算法|测试|销售|市场|实习|顾问|分析|教师|会计|律师|编辑|策划|总监|负责人|研究员|架构师|designer|engineer|manager|developer|analyst|intern)/i.test(
    line
  );
}

function findLocationCandidate(lines) {
  const labeled = findLabeledValue(lines, /^(城市|地点|所在地|location)[:：\s]/i);
  if (labeled) return labeled;
  const line = lines.find((item) => /(北京|上海|广州|深圳|杭州|成都|南京|武汉|西安|苏州|重庆|天津)/.test(item));
  return line?.match(/北京|上海|广州|深圳|杭州|成都|南京|武汉|西安|苏州|重庆|天津/)?.[0] || "";
}

function stripContact(line, contact = {}) {
  return String(line || "")
    .replace(contact.email || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(contact.phone || /(?:\+?86[-\s]?)?(?:1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/g, "")
    .replace(contact.website || /https?:\/\/[^\s]+/gi, "")
    .trim();
}

function removeLikelyProfileLines(lines, profile) {
  const firstSectionIndex = lines.findIndex((line) => isSectionHeading(line));
  if (firstSectionIndex > -1) return lines.slice(firstSectionIndex);

  return lines.filter((line, index) => {
    if (index > 10) return true;
    const clean = stripContact(line);
    if (!clean) return false;
    if (profile.name && clean.includes(profile.name)) return false;
    if (profile.role && clean.includes(profile.role)) return false;
    if (isContactOnly(line)) return false;
    return !/个人简历|resume/i.test(clean);
  });
}

function groupBySections(lines) {
  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const heading = detectKnownSection(line) || detectCustomSection(line);
    if (heading) {
      current = {
        id: `${heading.type}-${groups.length}`,
        type: heading.type,
        title: heading.title,
        lines: []
      };
      groups.push(current);
      return;
    }

    if (!current) {
      current = {
        id: "summary-0",
        type: "summary",
        title: knownTitles.summary,
        lines: []
      };
      groups.push(current);
    }

    current.lines.push(line);
  });

  return groups.filter((group) => group.lines.some((line) => !isContactOnly(line)));
}

function isSectionHeading(line) {
  return Boolean(detectKnownSection(line) || detectCustomSection(line));
}

function detectKnownSection(line) {
  const normalized = normalizeHeading(line);
  return sectionDefinitions.find((definition) =>
    definition.aliases.some((alias) => normalized === normalizeHeading(alias))
  );
}

function detectCustomSection(line) {
  const normalized = normalizeHeading(line);
  const matchedTitle = extraCustomHeadings.find((title) => normalized === normalizeHeading(title));
  if (matchedTitle) {
    return { type: "custom", title: matchedTitle };
  }

  if (looksLikeStandaloneHeading(line)) {
    return { type: "custom", title: line.replace(/[:：]$/, "") };
  }

  return null;
}

function normalizeHeading(line) {
  return String(line || "")
    .replace(/[#：:\s\-_—–|｜]/g, "")
    .toLowerCase();
}

function looksLikeStandaloneHeading(line) {
  const clean = line.replace(/[:：]$/, "").trim();
  if (clean.length < 2 || clean.length > 12) return false;
  if (hasDate(clean) || isContactOnly(clean) || isRoleLike(clean)) return false;
  if (/[。；;,.，]/.test(clean)) return false;
  return /(经历|经验|背景|能力|奖项|证书|论文|作品|评价|优势|技能|项目|教育|荣誉|语言)$/.test(clean);
}

function buildSection(group) {
  const cleanLines = group.lines.filter((line) => !isContactOnly(line));
  if (!cleanLines.length) return null;

  if (group.type === "summary" || group.type === "custom") {
    return baseSection(group, { content: cleanLines.join("\n") });
  }

  if (group.type === "skills") {
    return baseSection(group, { skills: cleanLines.join(", ") });
  }

  return baseSection(group, { entries: splitEntryChunks(cleanLines).map((chunk) => parseEntry(group.type, chunk)) });
}

function baseSection(group, overrides) {
  return {
    id: group.id,
    type: group.type,
    title: group.title || knownTitles[group.type] || "自定义模块",
    content: "",
    skills: "",
    entries: [],
    styleOverride: emptyStyleOverride(),
    ...overrides
  };
}

function isContactOnly(line) {
  return /^[\d\s+()\-]{7,}$/.test(line) || /@/.test(line) || /^https?:\/\//i.test(line);
}

function splitEntryChunks(lines) {
  const chunks = [];
  let chunk = [];

  lines.forEach((line, index) => {
    const startsEntry =
      index > 0 &&
      (hasDate(line) || /(?:公司|科技|大学|学院|学校|项目|平台|系统)$/.test(line)) &&
      chunk.length > 1;
    if (startsEntry) {
      chunks.push(chunk);
      chunk = [];
    }
    chunk.push(line);
  });

  if (chunk.length) chunks.push(chunk);
  return chunks;
}

function parseEntry(type, chunk) {
  const joined = chunk.join(" ");
  const period = extractPeriod(joined);
  const headingLine = chooseEntryHeading(type, chunk, period.raw);
  const titleLine = headingLine.replace(period.raw, "").replace(/\s+/g, " ").trim();
  const parts = splitEntryTitle(titleLine);
  const details = chunk
    .filter((line) => line !== headingLine)
    .map((line) => line.replace(period.raw, "").trim())
    .filter(Boolean)
    .join("\n");

  if (type === "education") {
    return {
      organization: findEducationOrg(chunk) || parts[0] || titleLine,
      title: "",
      major: findMajor(chunk) || parts.slice(2).join(" "),
      degree: findDegree(chunk) || parts[1] || "",
      start: period.start,
      end: period.end,
      details
    };
  }

  return {
    organization: parts[0] || titleLine,
    title: parts.slice(1).join(" ") || "",
    major: "",
    degree: "",
    start: period.start,
    end: period.end,
    details
  };
}

function chooseEntryHeading(type, chunk, periodRaw) {
  if (type === "education") {
    return chunk.find((line) => /(大学|学院|学校|研究生院)/.test(line)) || chunk[0] || "";
  }
  return chunk.find((line) => line.includes(periodRaw) && periodRaw) || chunk[0] || "";
}

function splitEntryTitle(titleLine) {
  const clean = titleLine
    .replace(/^[,，;；\-—–\s]+/, "")
    .replace(/[,，;；\-—–\s]+$/, "")
    .trim();
  const strongParts = clean.split(/\s{2,}|[·|｜]/).filter(Boolean);
  if (strongParts.length > 1) return strongParts;
  const looseParts = clean.split(/\s+/).filter(Boolean);
  if (looseParts.length > 1) return [looseParts[0], looseParts.slice(1).join(" ")];
  return [clean].filter(Boolean);
}

function hasDate(line) {
  return /\d{4}[./年-]\d{1,2}|\d{4}\s*(?:-|—|–|至|到|~)|至今|present/i.test(line);
}

function extractPeriod(text) {
  const match = text.match(
    /((?:20|19)\d{2}(?:[./年-]\d{1,2})?)\s*(?:-|—|–|至|到|~)\s*((?:20|19)\d{2}(?:[./年-]\d{1,2})?|至今|present)/i
  );
  return {
    raw: match?.[0] || "",
    start: normalizeDate(match?.[1] || ""),
    end: normalizeDate(match?.[2] || "")
  };
}

function normalizeDate(value) {
  return String(value || "")
    .replace("年", ".")
    .replace("月", "")
    .replace(/\//g, ".")
    .trim();
}

function findEducationOrg(lines) {
  return lines.join(" ").match(/[\u4e00-\u9fa5A-Za-z\s]*(?:大学|学院|学校|研究生院)/)?.[0]?.trim() || "";
}

function findDegree(lines) {
  return lines.join(" ").match(/(博士|硕士|研究生|本科|学士|大专|专科|MBA|PhD|Bachelor|Master)/i)?.[0] || "";
}

function findMajor(lines) {
  const text = lines.join(" ");
  const match = text.match(/(?:专业[:：]?\s*)([^，,；;\n]+)/);
  return match?.[1]?.trim() || "";
}
