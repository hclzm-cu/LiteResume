import { nextTick, ref } from "vue";
import { ElMessage } from "element-plus";
import html2pdfBundleUrl from "../../vendor/html2pdf.bundle.min.js?url";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const PRINT_VARIABLES = ["--accent", "--accent-soft", "--accent-border", "--accent-dark"];
let html2pdfLoader = null;

export function useResumeExport({ previewRef, profile, paginatePreview }) {
  const isExporting = ref(false);

  function printResume() {
    window.print();
  }

  async function exportPdf() {
    if (!previewRef.value) return;

    const filename = `${profile.name || "简历"}-${profile.role || "求职简历"}.pdf`.replace(
      /[\\/:*?"<>|]/g,
      "-"
    );

    isExporting.value = true;
    try {
      await paginatePreview();
      await nextTick();
      await document.fonts?.ready;
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      await exportPdfFromServer(buildPrintableHtml(previewRef.value), filename);
    } catch (error) {
      console.warn("服务端 PDF 导出不可用，改用浏览器端导出。", error);
      try {
        await exportPdfInBrowser(previewRef.value, filename);
        ElMessage.success("PDF 已生成并开始下载。");
      } catch (fallbackError) {
        console.error(fallbackError);
        ElMessage.error(fallbackError?.message || "PDF 导出失败，请稍后重试。");
      }
    } finally {
      isExporting.value = false;
    }
  }

  return {
    isExporting,
    printResume,
    exportPdf
  };
}

async function exportPdfFromServer(html, filename) {
  const response = await fetch(buildApiUrl("/api/export-pdf"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename,
      html
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "PDF 导出失败。");
  }

  const blob = await response.blob();
  downloadBlob(blob, filename);
}

async function exportPdfInBrowser(previewRoot, filename) {
  const html2pdf = await loadHtml2Pdf();
  const exportRoot = buildClientPdfElement(previewRoot);
  const pdfSource = exportRoot.querySelector(".resume-pages");

  try {
    await nextFrame();
    await waitForImages(exportRoot);
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: Math.min(window.devicePixelRatio || 2, 2),
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },
        pagebreak: {
          mode: ["css", "legacy"]
        }
      })
      .from(pdfSource)
      .save();
  } finally {
    exportRoot.remove();
  }
}

function buildPrintableHtml(previewRoot) {
  const appShell = previewRoot.closest(".app-shell");
  const variables = collectCssVariables(appShell);
  const styles = collectDocumentStyles();

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>简历导出</title>
    <style>${styles}</style>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html,
      body {
        width: 210mm;
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .print-export-root {
        ${variables}
        display: block !important;
        width: 210mm !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      .print-export-root .resume-pages {
        width: 210mm !important;
        display: block !important;
        justify-items: stretch !important;
        gap: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      .print-export-root .resume-page-shell {
        width: 210mm !important;
        display: block !important;
        gap: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        break-after: page;
        page-break-after: always;
      }

      .print-export-root .resume-page-shell:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .print-export-root .resume-paper {
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
      }

      .print-export-root .page-label,
      .print-export-root .pagination-measurer {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <main class="app-shell is-exporting print-export-root">${previewRoot.outerHTML}</main>
  </body>
</html>`;
}

function buildClientPdfElement(previewRoot) {
  const appShell = previewRoot.closest(".app-shell");
  const exportRoot = document.createElement("main");
  exportRoot.className = "app-shell is-exporting client-pdf-export-root";
  exportRoot.setAttribute("aria-hidden", "true");
  exportRoot.style.cssText = `
    ${collectCssVariables(appShell)}
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 10000 !important;
    display: block !important;
    width: 210mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
    pointer-events: none !important;
  `;

  const styles = document.createElement("style");
  styles.textContent = `
    .client-pdf-pages-export {
      width: 210mm !important;
      display: block !important;
      justify-items: stretch !important;
      gap: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    .client-pdf-pages-export .resume-page-shell {
      width: 210mm !important;
      height: 296.8mm !important;
      display: block !important;
      gap: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      break-after: page;
      page-break-after: always;
    }

    .client-pdf-pages-export .resume-page-shell:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .client-pdf-pages-export .resume-paper {
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: 296.8mm !important;
      min-height: 296.8mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }

    .client-pdf-pages-export .page-label,
    .client-pdf-pages-export .pagination-measurer {
      display: none !important;
    }
  `;

  const previewClone = previewRoot.cloneNode(true);
  previewClone.classList.add("client-pdf-pages-export");
  previewClone.style.cssText = `${previewClone.getAttribute("style") || ""}; ${collectCssVariables(appShell)}`;
  previewClone.prepend(styles);

  exportRoot.appendChild(previewClone);
  document.body.appendChild(exportRoot);
  return exportRoot;
}

function collectCssVariables(element) {
  if (!element) return "";
  const styles = getComputedStyle(element);
  return PRINT_VARIABLES.map((name) => `${name}: ${styles.getPropertyValue(name).trim()};`).join("\n");
}

function collectDocumentStyles() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildApiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function loadHtml2Pdf() {
  if (window.html2pdf) return Promise.resolve(window.html2pdf);
  if (html2pdfLoader) return html2pdfLoader;

  html2pdfLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = html2pdfBundleUrl;
    script.async = true;
    script.onload = () => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      reject(new Error("PDF 导出组件加载失败。"));
    };
    script.onerror = () => reject(new Error("PDF 导出组件加载失败。"));
    document.head.appendChild(script);
  });

  return html2pdfLoader;
}

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })
    )
  );
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
