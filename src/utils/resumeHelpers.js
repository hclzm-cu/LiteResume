export function emptyStyleOverride() {
  return {
    fontSize: null,
    lineHeight: null,
    spacing: null
  };
}

export function clone(source) {
  return JSON.parse(JSON.stringify(source));
}

export function splitLines(value = "") {
  return String(value)
    .split(/\n|；|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitTags(value = "") {
  return String(value)
    .split(/,|，|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitTextBlocks(value = "") {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (blocks.length > 1) return blocks;

  if (containsMarkdownSyntax(text)) return [text];

  return text
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function containsMarkdownSyntax(value) {
  return (
    /(^|\n)\s*(?:[-*+]\s+|\d+[.)]\s+|>\s+|#{1,6}\s+)/.test(value) ||
    /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)]+\))/.test(value)
  );
}

export function buildPreviewUnitsFromSections(sections) {
  const units = [];

  sections.forEach((section) => {
    if ((section.type === "summary" || section.type === "custom") && section.content.trim()) {
      const blocks = splitTextBlocks(section.content);
      blocks.forEach((content, index) => {
        units.push({
          id: `${section.id}-text-${index}`,
          section,
          kind: "text",
          content,
          showTitle: index === 0
        });
      });
      return;
    }

    if (section.type === "skills" && splitTags(section.skills).length) {
      units.push({
        id: `${section.id}-skills`,
        section,
        kind: "skills",
        showTitle: true
      });
      return;
    }

    if (section.entries.length) {
      section.entries.forEach((entry, index) => {
        units.push({
          id: `${section.id}-entry-${index}`,
          section,
          kind: "entry",
          entry,
          showTitle: index === 0
        });
      });
    }
  });

  return units;
}

export function sectionStyle(section, globalStyle) {
  return {
    "--section-font-size": `${section.styleOverride.fontSize || globalStyle.baseFontSize}px`,
    "--section-line-height": section.styleOverride.lineHeight || globalStyle.lineHeight,
    "--section-spacing": `${section.styleOverride.spacing || globalStyle.sectionSpacing}px`
  };
}

export function createPreviewPage(number, showHeader) {
  return {
    id: `page-${number}`,
    number,
    showHeader,
    units: []
  };
}

export function createEntry(type) {
  if (type === "education") {
    return {
      organization: "学校名称",
      title: "",
      location: "",
      major: "专业",
      degree: "学历",
      start: "",
      end: "",
      details: "课程、奖项或成绩"
    };
  }

  return {
    organization: type === "projects" ? "项目名称" : "公司名称",
    title: type === "projects" ? "角色" : "职位",
    location: "",
    major: "",
    degree: "",
    start: "",
    end: type === "experience" ? "present" : "",
    details: type === "projects" ? "项目背景\n关键动作\n量化结果" : "职责范围\n关键动作\n量化结果"
  };
}

export function sortEntriesByRecent(entries = []) {
  return [...entries].sort((first, second) => {
    const firstValue = entrySortValue(first);
    const secondValue = entrySortValue(second);
    if (firstValue === secondValue) return 0;
    return secondValue > firstValue ? 1 : -1;
  });
}

export function entryFields(type) {
  if (type === "education") {
    return [
      { key: "organization", label: "学校" },
      { key: "degree", label: "学历" },
      { key: "major", label: "专业" },
      { key: "location", label: "地点" },
      { key: "start", label: "开始时间", kind: "month" },
      { key: "end", label: "结束时间", kind: "month" }
    ];
  }

  return [
    { key: "organization", label: type === "projects" ? "项目名称" : "公司" },
    { key: "title", label: type === "projects" ? "角色" : "职位" },
    { key: "location", label: "地点" },
    { key: "start", label: "开始时间", kind: "month" },
    { key: "end", label: "结束时间", kind: "month" }
  ];
}

export function entryTitle(section, entry) {
  return section.type === "education" ? entry.organization : entry.organization || entry.title;
}

export function entrySubtitle(section, entry) {
  if (section.type === "education") {
    return [entry.degree, entry.major, entry.location].filter(Boolean).join(" · ");
  }
  return [entry.title, entry.location].filter(Boolean).join(" · ");
}

export function entryPeriod(entry, dateFormat = "dot") {
  return formatDateRange(entry.start, entry.end, dateFormat);
}

export function draftSectionSummary(section) {
  if (section.type === "summary") return section.content.slice(0, 80);
  if (section.type === "custom") return section.content.slice(0, 80);
  if (section.type === "skills") return splitTags(section.skills).slice(0, 8).join("、");
  return `${section.entries.length} 条`;
}

export function normalizeMonthValue(value) {
  const parsed = parseMonthValue(value);
  if (!parsed) return "";
  return `${parsed.year}-${String(parsed.month).padStart(2, "0")}`;
}

export function isPresentDate(value) {
  return ["present", "now", "current", "至今", "当前"].includes(String(value || "").trim().toLowerCase());
}

export function formatDateRange(start, end, dateFormat = "dot") {
  const startText = formatMonthValue(start, dateFormat);
  const endText = isPresentDate(end) ? "至今" : formatMonthValue(end, dateFormat);
  return [startText, endText].filter(Boolean).join(" - ");
}

export function formatMonthValue(value, dateFormat = "dot") {
  if (isPresentDate(value)) return "至今";
  const parsed = parseMonthValue(value);
  if (!parsed) return String(value || "").trim();

  const year = String(parsed.year);
  const month = String(parsed.month);
  if (dateFormat === "zh") return `${year}年${month}月`;
  if (dateFormat === "dash") return `${year}-${month}`;
  if (dateFormat === "slash") return `${year}/${month}`;
  return `${year}.${month}`;
}

function parseMonthValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized || isPresentDate(normalized)) return null;

  const match = normalized.match(/(19|20)\d{2}\D{0,3}([01]?\d)/);
  if (!match) return null;

  const year = Number(match[0].match(/(19|20)\d{2}/)?.[0]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

function entrySortValue(entry) {
  if (isPresentDate(entry.end)) return Number.POSITIVE_INFINITY;
  const end = parseMonthValue(entry.end);
  if (end) return end.year * 12 + end.month;
  const start = parseMonthValue(entry.start);
  if (start) return start.year * 12 + start.month;
  return Number.NEGATIVE_INFINITY;
}
