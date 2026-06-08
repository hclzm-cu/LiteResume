<script setup>
import { computed, watch } from "vue";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { BadgeCheck, Link, Mail, MapPin, Phone, UserRound } from "lucide-vue-next";
import CustomModuleDialog from "./components/CustomModuleDialog.vue";
import ImportPanel from "./components/ImportPanel.vue";
import LayoutToolbar from "./components/LayoutToolbar.vue";
import ProfileEditor from "./components/ProfileEditor.vue";
import ResumePreview from "./components/ResumePreview.vue";
import SectionEditor from "./components/SectionEditor.vue";
import {
  accents,
  customModulePresets,
  dateFormats,
  fontOptions,
  genderOptions,
  layoutModes,
  photoModes,
  politicalStatusOptions,
  templates
} from "./constants/resumeOptions";
import { useFitOnePage } from "./composables/useFitOnePage";
import { useResumeExport } from "./composables/useResumeExport";
import { useResumeImport } from "./composables/useResumeImport";
import { useResumePagination } from "./composables/useResumePagination";
import { useResumeState } from "./composables/useResumeState";
import { buildPreviewUnitsFromSections } from "./utils/resumeHelpers";

const elementLocale = zhCn;

const {
  profile,
  sections,
  globalStyle,
  selectedTemplate,
  selectedAccent,
  selectedLayoutMode,
  selectedDateFormat,
  customModuleDialog,
  resetResume: resetResumeState,
  applyLayoutMode,
  addEntry,
  removeEntry,
  moveEntry,
  sortSectionEntriesDesc,
  applyDraftToResume,
  openCustomModuleDialog,
  onCustomPresetChange,
  addCustomSection,
  removeSection,
  onPhotoChange,
  removePhoto
} = useResumeState();

const { importState, onImportFile, enhanceImportWithAi, applyImportDraft, clearImport } =
  useResumeImport({ applyDraftToResume });

const accentMeta = computed(
  () => accents.find((accent) => accent.value === selectedAccent.value) || accents[0]
);

const appStyle = computed(() => ({
  "--accent": accentMeta.value.value,
  "--accent-soft": accentMeta.value.soft,
  "--accent-border": accentMeta.value.border,
  "--accent-dark": accentMeta.value.dark
}));

const paperStyle = computed(() => ({
  "--resume-font-family": globalStyle.fontFamily,
  "--resume-base-font-size": `${globalStyle.baseFontSize}px`,
  "--resume-line-height": globalStyle.lineHeight,
  "--resume-section-gap": `${globalStyle.sectionSpacing}px`,
  "--resume-page-margin-x": `${globalStyle.pageMarginX}mm`,
  "--resume-page-margin-y": `${globalStyle.pageMarginY}mm`
}));

const contactItems = computed(() =>
  [
    { icon: Phone, value: profile.phone },
    { icon: Mail, value: profile.email },
    { icon: MapPin, value: profile.location },
    { icon: UserRound, value: profile.gender },
    { icon: BadgeCheck, value: profile.politicalStatus },
    { icon: Link, value: profile.website }
  ].filter((item) => item.value)
);

const previewUnits = computed(() => buildPreviewUnitsFromSections(sections.value));
const {
  previewRef,
  previewPages,
  renderedPages,
  schedulePagination,
  paginatePreview,
  setPreviewRef,
  setMeasureRef,
  setHeaderMeasureRef
} = useResumePagination(previewUnits);

const { isFitting, fitSnapshot, fitMessage, fitResumeToOnePage, undoFit, clearFitState } =
  useFitOnePage({
    globalStyle,
    sections,
    previewPages,
    paginatePreview,
    schedulePagination
  });

const { isExporting, printResume, exportPdf } = useResumeExport({
  previewRef,
  profile,
  paginatePreview
});

function resetResume() {
  resetResumeState();
  clearFitState();
}

watch(
  [sections, profile, globalStyle, selectedTemplate, selectedAccent, selectedLayoutMode, selectedDateFormat],
  () => {
    if (isFitting.value) return;
    schedulePagination();
  },
  { deep: true, flush: "post" }
);
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <main class="app-shell" :class="{ 'is-exporting': isExporting }" :style="appStyle">
      <LayoutToolbar
        v-model:selected-template="selectedTemplate"
        v-model:selected-accent="selectedAccent"
        v-model:selected-date-format="selectedDateFormat"
        :selected-layout-mode="selectedLayoutMode"
        :templates="templates"
        :layout-modes="layoutModes"
        :date-formats="dateFormats"
        :accents="accents"
        :font-options="fontOptions"
        :global-style="globalStyle"
        :is-fitting="isFitting"
        :fit-snapshot="fitSnapshot"
        :is-exporting="isExporting"
        :fit-message="fitMessage"
        @reset="resetResume"
        @update:selected-layout-mode="applyLayoutMode"
        @fit-one-page="fitResumeToOnePage"
        @undo-fit="undoFit"
        @export-pdf="exportPdf"
      />

      <section class="workspace" aria-label="简历制作工作区">
        <aside class="editor-pane" aria-label="简历编辑">
          <ImportPanel
            :import-state="importState"
            @clear="clearImport"
            @import-file="onImportFile"
            @enhance-ai="enhanceImportWithAi"
            @apply="applyImportDraft"
          />

          <form class="form-stack">
            <ProfileEditor
              :profile="profile"
              :gender-options="genderOptions"
              :political-status-options="politicalStatusOptions"
              :photo-modes="photoModes"
              @photo-change="onPhotoChange"
              @remove-photo="removePhoto"
            />
            <SectionEditor
              v-model:sections="sections"
              :global-style="globalStyle"
              @open-custom-module-dialog="openCustomModuleDialog"
              @add-entry="addEntry"
              @remove-entry="removeEntry"
              @move-entry="moveEntry"
              @sort-section-entries="sortSectionEntriesDesc"
              @remove-section="removeSection"
            />
          </form>
        </aside>

        <ResumePreview
          :rendered-pages="renderedPages"
          :preview-units="previewUnits"
          :profile="profile"
          :contact-items="contactItems"
          :selected-template="selectedTemplate"
          :date-format="selectedDateFormat"
          :paper-style="paperStyle"
          :global-style="globalStyle"
          :set-preview-ref="setPreviewRef"
          :set-measure-ref="setMeasureRef"
          :set-header-measure-ref="setHeaderMeasureRef"
          @print="printResume"
        />
      </section>

      <CustomModuleDialog
        :custom-module-dialog="customModuleDialog"
        :custom-module-presets="customModulePresets"
        @preset-change="onCustomPresetChange"
        @add="addCustomSection"
      />
    </main>
  </ElConfigProvider>
</template>
