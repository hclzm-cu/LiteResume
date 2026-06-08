import { nextTick, ref } from "vue";

const API_BASE_URL = "http://127.0.0.1:8787";
const PRINT_VARIABLES = ["--accent", "--accent-soft", "--accent-border", "--accent-dark"];

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

      const response = await fetch(`${API_BASE_URL}/api/export-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename,
          html: buildPrintableHtml(previewRef.value)
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "PDF 导出失败。");
      }

      const blob = await response.blob();
      downloadBlob(blob, filename);
    } catch (error) {
      console.error(error);
      window.print();
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
