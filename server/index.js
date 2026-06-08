import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import OpenAI from "openai";
import puppeteer from "puppeteer-core";

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 8787);
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const localOriginPattern = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || localOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("仅允许本机页面访问本地 API。"));
    }
  })
);
app.use(express.json({ limit: "25mb" }));

const resumeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["profile", "sections", "warnings"],
  properties: {
    profile: {
      type: "object",
      additionalProperties: false,
      required: ["name", "role", "phone", "email", "location", "gender", "politicalStatus", "website"],
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        location: { type: "string" },
        gender: { type: "string" },
        politicalStatus: { type: "string" },
        website: { type: "string" }
      }
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "title", "content", "skills", "entries", "styleOverride"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["summary", "experience", "projects", "education", "skills", "custom"]
          },
          title: { type: "string" },
          content: { type: "string" },
          skills: { type: "string" },
          entries: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "organization",
                "title",
                "location",
                "major",
                "degree",
                "start",
                "end",
                "details"
              ],
              properties: {
                organization: { type: "string" },
                title: { type: "string" },
                location: { type: "string" },
                major: { type: "string" },
                degree: { type: "string" },
                start: { type: "string" },
                end: { type: "string" },
                details: { type: "string" }
              }
            }
          },
          styleOverride: {
            type: "object",
            additionalProperties: false,
            required: ["fontSize", "lineHeight", "spacing"],
            properties: {
              fontSize: { type: ["number", "null"] },
              lineHeight: { type: ["number", "null"] },
              spacing: { type: ["number", "null"] }
            }
          }
        }
      }
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    }
  }
};

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    model
  });
});

app.post("/api/parse-resume", async (request, response) => {
  if (!process.env.OPENAI_API_KEY) {
    response.status(400).json({
      error: "未配置 OPENAI_API_KEY。请复制 .env.example 为 .env 并填入 Key 后重启服务。"
    });
    return;
  }

  const { sourceType, rawText, localDraft } = request.body || {};
  if (!rawText || typeof rawText !== "string") {
    response.status(400).json({ error: "缺少 rawText，无法进行 AI 解析。" });
    return;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "你是中文简历解析助手。请把用户已有简历拆成结构化数据，保留事实，不编造公司、学校、日期、指标。输出必须匹配 JSON Schema。"
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceType,
            rawText: rawText.slice(0, 18000),
            localDraft
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_parse_result",
          schema: resumeSchema,
          strict: true
        }
      }
    });

    const payload = JSON.parse(result.output_text || "{}");
    response.json(payload);
  } catch (error) {
    response.status(500).json({
      error: error?.message || "AI 解析失败，请稍后重试。"
    });
  }
});

app.post("/api/export-pdf", async (request, response) => {
  const { html, filename } = request.body || {};
  if (!html || typeof html !== "string") {
    response.status(400).json({ error: "缺少可打印 HTML，无法导出 PDF。" });
    return;
  }

  let browser;
  try {
    const executablePath = findChromeExecutablePath();
    if (!executablePath) {
      response.status(500).json({
        error: "未找到 Chrome 或 Edge。请安装 Chrome，或在 .env 中配置 CHROME_PATH。"
      });
      return;
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: ["domcontentloaded", "load"], timeout: 30000 });
    await page.emulateMediaType("print");
    await page.evaluate(() => document.fonts?.ready.then(() => true));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm"
      }
    });

    const safeFilename = sanitizePdfFilename(filename);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    response.end(pdf);
  } catch (error) {
    response.status(500).json({
      error: error?.message || "PDF 导出失败，请稍后重试。"
    });
  } finally {
    await browser?.close().catch(() => {});
  }
});

function findChromeExecutablePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : "",
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`
      : ""
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function sanitizePdfFilename(filename) {
  const fallback = "简历.pdf";
  const normalized = String(filename || fallback)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.endsWith(".pdf") ? normalized : `${normalized || "简历"}.pdf`;
}

app.listen(port, "127.0.0.1", () => {
  console.log(`Resume parser API listening on http://127.0.0.1:${port}`);
});
