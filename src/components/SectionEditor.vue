<script setup>
import { computed } from "vue";
import { ElCheckbox, ElDatePicker } from "element-plus";
import Draggable from "vuedraggable";
import {
  ArrowDown,
  ArrowDownWideNarrow,
  ArrowUp,
  GripVertical,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2
} from "lucide-vue-next";
import MarkdownEditor from "./MarkdownEditor.vue";
import {
  emptyStyleOverride,
  entryFields,
  isPresentDate,
  normalizeMonthValue
} from "../utils/resumeHelpers";

const props = defineProps({
  sections: {
    type: Array,
    required: true
  },
  globalStyle: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  "update:sections",
  "open-custom-module-dialog",
  "add-entry",
  "remove-entry",
  "move-entry",
  "sort-section-entries",
  "remove-section"
]);

const editableSections = computed({
  get: () => props.sections,
  set: (value) => emit("update:sections", value)
});

function resetSectionStyle(section) {
  section.styleOverride = emptyStyleOverride();
}

function entryMonthValue(value) {
  return normalizeMonthValue(value) || "";
}

function updateEntryMonth(entry, key, value) {
  entry[key] = value || "";
}

function isPresentEnd(entry) {
  return isPresentDate(entry.end);
}

function togglePresentEnd(entry, value) {
  entry.end = value ? "present" : "";
}

function isEntrySection(section) {
  return section.entries.length || ["experience", "projects", "education"].includes(section.type);
}
</script>

<template>
  <section class="form-section" aria-labelledby="moduleTitle">
    <div class="section-heading">
      <h2 id="moduleTitle">模块排版</h2>
      <div class="heading-actions">
        <span class="muted-text">拖动左侧手柄调整顺序</span>
        <button class="primary-button small" type="button" @click="$emit('open-custom-module-dialog')">
          <Plus />
          新增模块
        </button>
      </div>
    </div>
    <Draggable v-model="editableSections" class="section-drag-list" handle=".drag-handle" item-key="id" tag="div">
      <template #item="{ element: section }">
        <div class="module-editor">
          <div class="module-heading">
            <button class="icon-button drag-handle" type="button" :aria-label="`拖动${section.title}`">
              <GripVertical />
            </button>
            <input v-model="section.title" class="module-title-input" />
            <button
              class="icon-button"
              type="button"
              :aria-label="`调整${section.title}样式`"
              @click="section.settingsOpen = !section.settingsOpen"
            >
              <SlidersHorizontal />
            </button>
            <button
              v-if="isEntrySection(section)"
              class="icon-button"
              type="button"
              :aria-label="`添加${section.title}`"
              @click="$emit('add-entry', section)"
            >
              <Plus />
            </button>
            <button
              v-if="isEntrySection(section)"
              class="ghost-button small sort-entry-button"
              type="button"
              :disabled="section.entries.length < 2"
              :aria-label="`智能倒序排列${section.title}`"
              @click="$emit('sort-section-entries', section)"
            >
              <ArrowDownWideNarrow />
              智能倒序
            </button>
            <button
              class="icon-button danger-button"
              type="button"
              :aria-label="`删除${section.title}`"
              @click="$emit('remove-section', section)"
            >
              <Trash2 />
            </button>
          </div>

          <div v-if="section.settingsOpen" class="module-style-grid">
            <label>
              模块字号
              <input
                v-model.number="section.styleOverride.fontSize"
                :placeholder="`${globalStyle.baseFontSize}`"
                min="11"
                max="16"
                step="0.25"
                type="number"
              />
            </label>
            <label>
              模块行距
              <input
                v-model.number="section.styleOverride.lineHeight"
                :placeholder="`${globalStyle.lineHeight}`"
                min="1.25"
                max="2"
                step="0.01"
                type="number"
              />
            </label>
            <label>
              模块间距
              <input
                v-model.number="section.styleOverride.spacing"
                :placeholder="`${globalStyle.sectionSpacing}`"
                min="6"
                max="30"
                step="1"
                type="number"
              />
            </label>
            <button class="ghost-button small" type="button" @click="resetSectionStyle(section)">
              <RotateCcw />
              重置模块样式
            </button>
          </div>

          <MarkdownEditor
            v-if="section.type === 'summary' || section.type === 'custom'"
            v-model="section.content"
            :rows="4"
          />
          <textarea v-else-if="section.type === 'skills'" v-model="section.skills" rows="3"></textarea>
          <div v-else class="entry-list">
            <div
              v-for="(entry, index) in section.entries"
              :key="`${section.id}-${index}`"
              class="entry-editor"
            >
              <div class="entry-heading">
                <strong>{{ entry.organization || entry.title || `${section.title} ${index + 1}` }}</strong>
                <div class="entry-actions">
                  <button
                    class="icon-button"
                    type="button"
                    aria-label="上移"
                    @click="$emit('move-entry', section, index, -1)"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    class="icon-button"
                    type="button"
                    aria-label="下移"
                    @click="$emit('move-entry', section, index, 1)"
                  >
                    <ArrowDown />
                  </button>
                  <button
                    class="icon-button danger-button"
                    type="button"
                    aria-label="删除"
                    @click="$emit('remove-entry', section, index)"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
              <div class="field-grid">
                <label v-for="field in entryFields(section.type)" :key="field.key">
                  {{ field.label }}
                  <div v-if="field.kind === 'month'" class="date-control">
                    <ElDatePicker
                      :model-value="entryMonthValue(entry[field.key])"
                      type="month"
                      value-format="YYYY-MM"
                      format="YYYY 年 MM 月"
                      :placeholder="field.key === 'start' ? '选择开始月份' : '选择结束月份'"
                      :disabled="field.key === 'end' && isPresentEnd(entry)"
                      @update:model-value="updateEntryMonth(entry, field.key, $event)"
                    />
                    <ElCheckbox
                      v-if="field.key === 'end'"
                      :model-value="isPresentEnd(entry)"
                      @update:model-value="togglePresentEnd(entry, $event)"
                    >
                      至今
                    </ElCheckbox>
                  </div>
                  <input v-else v-model="entry[field.key]" type="text" />
                </label>
                <div class="wide-field markdown-field">
                  <span class="field-label">成果描述</span>
                  <MarkdownEditor
                    v-model="entry.details"
                    :rows="3"
                    placeholder="支持加粗、列表、链接；需要列表时可使用工具栏"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Draggable>
  </section>
</template>
