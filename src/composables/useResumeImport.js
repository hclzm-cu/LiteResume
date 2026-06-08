import { reactive } from "vue";
import { ElMessage } from "element-plus";

async function getImportTools() {
  return await import("../resumeImport");
}

export function useResumeImport({ applyDraftToResume }) {
  const importState = reactive({
    fileName: "",
    sourceType: "",
    rawText: "",
    draft: null,
    warnings: [],
    error: "",
    status: "",
    loading: false,
    aiLoading: false
  });

  async function onImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    importState.fileName = file.name;
    importState.loading = true;
    importState.error = "";
    importState.status = "正在读取简历文本...";
    importState.warnings = [];
    importState.draft = null;

    try {
      const { normalizeDraft, parseResumeText, readResumeFile } = await getImportTools();
      const result = await readResumeFile(file);
      importState.sourceType = result.sourceType;
      importState.rawText = result.rawText;
      const draft = normalizeDraft(parseResumeText(result.rawText));
      importState.draft = draft;
      importState.warnings = draft.warnings;
      importState.status = "本地解析完成，可预览后应用。";
    } catch (error) {
      importState.error = error?.message || "读取文件失败。";
      importState.status = "";
    } finally {
      importState.loading = false;
      event.target.value = "";
    }
  }

  async function enhanceImportWithAi() {
    importState.error = "";
    importState.status = "AI 增强分析暂未开放，后端接口已保留。当前只使用本地规则解析。";
    ElMessage.info("AI 增强分析暂未开放，接口已保留。");
  }

  function applyImportDraft() {
    if (!applyDraftToResume(importState.draft)) return;
    importState.status = "已应用导入内容。";
  }

  function clearImport() {
    Object.assign(importState, {
      fileName: "",
      sourceType: "",
      rawText: "",
      draft: null,
      warnings: [],
      error: "",
      status: "",
      loading: false,
      aiLoading: false
    });
  }

  return {
    importState,
    onImportFile,
    enhanceImportWithAi,
    applyImportDraft,
    clearImport
  };
}
