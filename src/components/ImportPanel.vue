<script setup>
import { AlertCircle, CheckCircle2, FileText, Wand2, X } from "lucide-vue-next";
import { draftSectionSummary } from "../utils/resumeHelpers";

defineProps({
  importState: {
    type: Object,
    required: true
  }
});

defineEmits(["clear", "import-file", "enhance-ai", "apply"]);
</script>

<template>
  <section class="form-section import-section" aria-labelledby="importTitle">
    <div class="section-heading">
      <h2 id="importTitle">导入已有简历</h2>
      <button class="ghost-button small" type="button" @click="$emit('clear')">
        <X />
        清空
      </button>
    </div>
    <label class="file-drop">
      <FileText />
      <span>{{ importState.fileName || "上传 PDF / MD 简历" }}</span>
      <input accept=".pdf,.md,.markdown" type="file" @change="$emit('import-file', $event)" />
    </label>
    <div class="import-actions">
      <button
        class="ghost-button"
        type="button"
        :disabled="importState.aiLoading"
        @click="$emit('enhance-ai')"
      >
        <Wand2 />
        AI 增强解析（暂未开放）
      </button>
      <button class="primary-button" type="button" :disabled="!importState.draft" @click="$emit('apply')">
        <CheckCircle2 />
        应用解析结果
      </button>
    </div>
    <p v-if="importState.status" class="status-text good">{{ importState.status }}</p>
    <p v-if="importState.error" class="status-text bad">
      <AlertCircle />
      {{ importState.error }}
    </p>
    <ul v-if="importState.warnings.length" class="warning-list">
      <li v-for="warning in importState.warnings" :key="warning">{{ warning }}</li>
    </ul>
    <div v-if="importState.draft" class="draft-preview">
      <strong>解析预览</strong>
      <span>{{ importState.draft.profile.name || "未识别姓名" }}</span>
      <span v-for="section in importState.draft.sections" :key="section.id">
        {{ section.title }}：{{ draftSectionSummary(section) }}
      </span>
    </div>
  </section>
</template>
