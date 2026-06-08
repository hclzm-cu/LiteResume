<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Undo2
} from "lucide-vue-next";

const props = defineProps({
  templates: {
    type: Array,
    required: true
  },
  layoutModes: {
    type: Array,
    required: true
  },
  dateFormats: {
    type: Array,
    required: true
  },
  accents: {
    type: Array,
    required: true
  },
  chineseFontOptions: {
    type: Array,
    required: true
  },
  englishFontOptions: {
    type: Array,
    required: true
  },
  selectedTemplate: {
    type: String,
    required: true
  },
  selectedAccent: {
    type: String,
    required: true
  },
  selectedLayoutMode: {
    type: String,
    required: true
  },
  selectedDateFormat: {
    type: String,
    required: true
  },
  globalStyle: {
    type: Object,
    required: true
  },
  isFitting: {
    type: Boolean,
    required: true
  },
  fitSnapshot: {
    type: Object,
    default: null
  },
  isExporting: {
    type: Boolean,
    required: true
  },
  fitMessage: {
    type: String,
    default: ""
  }
});

const fitToastVisible = ref(false);
const fitToastMessage = ref("");
let fitToastTimer = 0;

const isFitToastWarning = computed(() => fitToastMessage.value.startsWith("仍然超过一页"));
const fitToastIcon = computed(() => (isFitToastWarning.value ? AlertTriangle : CheckCircle2));

watch(
  () => props.fitMessage,
  (message) => {
    window.clearTimeout(fitToastTimer);

    if (!message) {
      fitToastVisible.value = false;
      return;
    }

    fitToastMessage.value = message;
    fitToastVisible.value = true;
    fitToastTimer = window.setTimeout(
      () => {
        fitToastVisible.value = false;
      },
      isFitToastWarning.value ? 5200 : 2600
    );
  }
);

onBeforeUnmount(() => {
  window.clearTimeout(fitToastTimer);
});

defineEmits([
  "update:selectedTemplate",
  "update:selectedAccent",
  "update:selectedLayoutMode",
  "update:selectedDateFormat",
  "reset",
  "fit-one-page",
  "undo-fit",
  "export-pdf"
]);
</script>

<template>
  <section class="layout-toolbar" aria-label="排版工具栏">
    <div class="toolbar-brand">
      <span class="brand-mark" aria-hidden="true">R</span>
      <h1>简历制作台</h1>
    </div>

    <div class="toolbar-group toolbar-group-compact">
      <label>
        模板
        <select :value="selectedTemplate" @change="$emit('update:selectedTemplate', $event.target.value)">
          <option v-for="template in templates" :key="template.value" :value="template.value">
            {{ template.label }}
          </option>
        </select>
      </label>
      <label>
        排版方式
        <select :value="selectedLayoutMode" @change="$emit('update:selectedLayoutMode', $event.target.value)">
          <option v-for="mode in layoutModes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
      </label>
      <label>
        主题色
        <select :value="selectedAccent" @change="$emit('update:selectedAccent', $event.target.value)">
          <option v-for="accent in accents" :key="accent.value" :value="accent.value">
            {{ accent.label }}
          </option>
        </select>
      </label>
      <label>
        中文字体
        <select v-model="globalStyle.chineseFontFamily">
          <option v-for="font in chineseFontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </label>
      <label>
        英文字体
        <select v-model="globalStyle.englishFontFamily">
          <option v-for="font in englishFontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </label>
      <label>
        日期样式
        <select :value="selectedDateFormat" @change="$emit('update:selectedDateFormat', $event.target.value)">
          <option v-for="format in dateFormats" :key="format.value" :value="format.value">
            {{ format.sample }}
          </option>
        </select>
      </label>
    </div>

    <div class="toolbar-group toolbar-sliders">
      <label>
        字号 {{ globalStyle.baseFontSize }}px
        <input v-model.number="globalStyle.baseFontSize" min="11" max="15" step="0.25" type="range" />
      </label>
      <label>
        行距 {{ globalStyle.lineHeight }}
        <input v-model.number="globalStyle.lineHeight" min="1.35" max="1.9" step="0.01" type="range" />
      </label>
      <label>
        模块 {{ globalStyle.sectionSpacing }}px
        <input v-model.number="globalStyle.sectionSpacing" min="8" max="26" step="1" type="range" />
      </label>
      <label>
        左右 {{ globalStyle.pageMarginX }}mm
        <input v-model.number="globalStyle.pageMarginX" min="12" max="22" step="1" type="range" />
      </label>
      <label>
        上下 {{ globalStyle.pageMarginY }}mm
        <input v-model.number="globalStyle.pageMarginY" min="10" max="22" step="1" type="range" />
      </label>
    </div>

    <div class="toolbar-actions">
      <button class="ghost-button" type="button" @click="$emit('reset')">
        <RotateCcw />
        重置
      </button>
      <button class="ghost-button" type="button" :disabled="isFitting" @click="$emit('fit-one-page')">
        <Sparkles />
        智能一页
      </button>
      <button class="ghost-button" type="button" :disabled="!fitSnapshot" @click="$emit('undo-fit')">
        <Undo2 />
        撤销压缩
      </button>
      <button class="primary-button" type="button" :disabled="isExporting" @click="$emit('export-pdf')">
        <Loader2 v-if="isExporting" class="spin-icon" />
        <Download v-else />
        {{ isExporting ? "生成中" : "导出 PDF" }}
      </button>
    </div>

    <Transition name="fit-toast">
      <div
        v-if="fitToastVisible"
        class="fit-toast"
        :class="{ 'is-warning': isFitToastWarning }"
        role="status"
        aria-live="polite"
      >
        <component :is="fitToastIcon" />
        <span>{{ fitToastMessage }}</span>
      </div>
    </Transition>
  </section>
</template>
