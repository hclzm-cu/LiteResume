<script setup>
import { Printer } from "lucide-vue-next";
import {
  entryPeriod,
  entrySubtitle,
  entryTitle,
  sectionStyle,
  splitTags
} from "../utils/resumeHelpers";
import { renderMarkdown } from "../utils/markdown";

defineProps({
  renderedPages: {
    type: Array,
    required: true
  },
  previewUnits: {
    type: Array,
    required: true
  },
  profile: {
    type: Object,
    required: true
  },
  contactItems: {
    type: Array,
    required: true
  },
  selectedTemplate: {
    type: String,
    required: true
  },
  dateFormat: {
    type: String,
    required: true
  },
  paperStyle: {
    type: Object,
    required: true
  },
  globalStyle: {
    type: Object,
    required: true
  },
  setPreviewRef: {
    type: Function,
    required: true
  },
  setMeasureRef: {
    type: Function,
    required: true
  },
  setHeaderMeasureRef: {
    type: Function,
    required: true
  }
});

defineEmits(["print"]);
</script>

<template>
  <section class="preview-pane" aria-label="实时预览">
    <div class="preview-toolbar">
      <span>实时预览</span>
      <button class="ghost-button small" type="button" @click="$emit('print')">
        <Printer />
        打印
      </button>
    </div>
    <div class="paper-stage">
      <div :ref="setPreviewRef" class="resume-pages">
        <div v-for="page in renderedPages" :key="page.id" class="resume-page-shell">
          <article
            class="resume-paper"
            :class="[
              `template-${selectedTemplate}`,
              {
                'has-photo': profile.photo.dataUrl && profile.photo.mode !== 'hidden',
                'has-page-header': page.showHeader
              }
            ]"
            :style="paperStyle"
          >
            <header v-if="page.showHeader" class="resume-header">
              <div class="resume-identity">
                <div>
                  <h2>{{ profile.name || "姓名" }}</h2>
                  <div class="resume-role">{{ profile.role || "求职方向" }}</div>
                </div>
                <img
                  v-if="profile.photo.dataUrl && profile.photo.mode !== 'hidden'"
                  class="resume-photo"
                  :class="`photo-${profile.photo.mode}`"
                  :src="profile.photo.dataUrl"
                  alt="简历照片"
                />
              </div>
              <div class="resume-contact">
                <span v-for="item in contactItems" :key="item.value">
                  <component :is="item.icon" />
                  {{ item.value }}
                </span>
              </div>
            </header>

            <div class="resume-body">
              <section
                v-for="unit in page.units"
                :key="`${page.id}-${unit.id}`"
                class="resume-section"
                :style="sectionStyle(unit.section, globalStyle)"
              >
                <h3 v-if="unit.showTitle">{{ unit.section.title }}</h3>

                <div
                  v-if="unit.kind === 'text'"
                  class="markdown-content"
                  v-html="renderMarkdown(unit.content)"
                ></div>

                <ul v-else-if="unit.kind === 'skills'" class="skill-list">
                  <li v-for="skill in splitTags(unit.section.skills)" :key="skill">{{ skill }}</li>
                </ul>

                <div v-else-if="unit.kind === 'entry'" class="resume-entry">
                  <div class="resume-entry-head">
                    <div>
                      <h4 class="resume-entry-title">{{ entryTitle(unit.section, unit.entry) }}</h4>
                      <div v-if="entrySubtitle(unit.section, unit.entry)" class="resume-entry-subtitle">
                        {{ entrySubtitle(unit.section, unit.entry) }}
                      </div>
                    </div>
                    <div v-if="entryPeriod(unit.entry, dateFormat)" class="resume-entry-time">
                      {{ entryPeriod(unit.entry, dateFormat) }}
                    </div>
                  </div>
                  <div
                    v-if="unit.entry.details.trim()"
                    class="markdown-content entry-details-markdown"
                    v-html="renderMarkdown(unit.entry.details)"
                  ></div>
                </div>
              </section>
            </div>
          </article>
          <div class="page-label">第 {{ page.number }} 页</div>
        </div>
      </div>

      <div class="pagination-measurer" aria-hidden="true">
        <article
          :ref="setMeasureRef"
          class="resume-paper measure-paper"
          :class="[
            `template-${selectedTemplate}`,
            {
              'has-photo': profile.photo.dataUrl && profile.photo.mode !== 'hidden',
              'has-page-header': true
            }
          ]"
          :style="paperStyle"
        >
          <header :ref="setHeaderMeasureRef" class="resume-header">
            <div class="resume-identity">
              <div>
                <h2>{{ profile.name || "姓名" }}</h2>
                <div class="resume-role">{{ profile.role || "求职方向" }}</div>
              </div>
              <img
                v-if="profile.photo.dataUrl && profile.photo.mode !== 'hidden'"
                class="resume-photo"
                :class="`photo-${profile.photo.mode}`"
                :src="profile.photo.dataUrl"
                alt=""
              />
            </div>
            <div class="resume-contact">
              <span v-for="item in contactItems" :key="`measure-${item.value}`">
                <component :is="item.icon" />
                {{ item.value }}
              </span>
            </div>
          </header>

          <div class="resume-body">
            <section
              v-for="unit in previewUnits"
              :key="`measure-${unit.id}`"
              class="resume-section"
              :style="sectionStyle(unit.section, globalStyle)"
              data-measure-unit
            >
              <h3 v-if="unit.showTitle">{{ unit.section.title }}</h3>

              <div
                v-if="unit.kind === 'text'"
                class="markdown-content"
                v-html="renderMarkdown(unit.content)"
              ></div>

              <ul v-else-if="unit.kind === 'skills'" class="skill-list">
                <li v-for="skill in splitTags(unit.section.skills)" :key="`measure-${unit.id}-${skill}`">
                  {{ skill }}
                </li>
              </ul>

              <div v-else-if="unit.kind === 'entry'" class="resume-entry">
                <div class="resume-entry-head">
                  <div>
                    <h4 class="resume-entry-title">{{ entryTitle(unit.section, unit.entry) }}</h4>
                    <div v-if="entrySubtitle(unit.section, unit.entry)" class="resume-entry-subtitle">
                      {{ entrySubtitle(unit.section, unit.entry) }}
                    </div>
                  </div>
                  <div v-if="entryPeriod(unit.entry, dateFormat)" class="resume-entry-time">
                    {{ entryPeriod(unit.entry, dateFormat) }}
                  </div>
                </div>
                <div
                  v-if="unit.entry.details.trim()"
                  class="markdown-content entry-details-markdown"
                  v-html="renderMarkdown(unit.entry.details)"
                ></div>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
