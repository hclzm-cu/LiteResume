import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  customModulePresets,
  defaultGlobalStyle,
  layoutModes,
  sectionTypeLabels
} from "../constants/resumeOptions";
import { defaultProfile, defaultSections } from "../data/defaultResume";
import { clone, createEntry, emptyStyleOverride, sortEntriesByRecent } from "../utils/resumeHelpers";

export function useResumeState() {
  const profile = reactive(clone(defaultProfile));
  const sections = ref(clone(defaultSections));
  const globalStyle = reactive(clone(defaultGlobalStyle));
  const selectedTemplate = ref("modern");
  const selectedAccent = ref("#0f766e");
  const selectedLayoutMode = ref("standard");
  const selectedDateFormat = ref("dot");

  const customModuleDialog = reactive({
    visible: false,
    title: "自定义模块",
    preset: "text"
  });

  function resetResume() {
    Object.assign(profile, clone(defaultProfile));
    sections.value = clone(defaultSections);
    Object.assign(globalStyle, clone(defaultGlobalStyle));
    selectedTemplate.value = "modern";
    selectedAccent.value = "#0f766e";
    selectedLayoutMode.value = "standard";
    selectedDateFormat.value = "dot";
  }

  function applyLayoutMode(value) {
    const mode = layoutModes.find((item) => item.value === value) || layoutModes[0];
    selectedLayoutMode.value = mode.value;
    Object.assign(globalStyle, mode.style);
  }

  function addEntry(section) {
    section.entries.push(createEntry(section.type));
  }

  function removeEntry(section, index) {
    section.entries.splice(index, 1);
  }

  function moveEntry(section, index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= section.entries.length) return;
    const [entry] = section.entries.splice(index, 1);
    section.entries.splice(nextIndex, 0, entry);
  }

  function sortSectionEntriesDesc(section) {
    if (!Array.isArray(section.entries) || section.entries.length < 2) return;
    section.entries = sortEntriesByRecent(section.entries);
    ElMessage.success("已按时间智能倒序排列");
  }

  function applyDraftToResume(draft) {
    if (!draft) return false;

    Object.entries(draft.profile || {}).forEach(([key, value]) => {
      if (key in profile && value) profile[key] = value;
    });

    if (Array.isArray(draft.sections) && draft.sections.length) {
      sections.value = draft.sections.map((section, index) => ({
        id: section.id || `${section.type}-${index}`,
        type: section.type,
        title: section.title || sectionTypeLabels[section.type] || "简历模块",
        content: section.content || "",
        skills: section.skills || "",
        entries: Array.isArray(section.entries)
          ? section.entries.map((entry) => ({
              organization: entry.organization || "",
              title: entry.title || "",
              location: entry.location || "",
              major: entry.major || "",
              degree: entry.degree || "",
              start: entry.start || "",
              end: entry.end || "",
              details: entry.details || ""
            }))
          : [],
        styleOverride: { ...emptyStyleOverride(), ...(section.styleOverride || {}) },
        settingsOpen: false
      }));
    }

    return true;
  }

  function openCustomModuleDialog() {
    customModuleDialog.preset = "text";
    customModuleDialog.title = "自定义模块";
    customModuleDialog.visible = true;
  }

  function onCustomPresetChange(value) {
    const preset = customModulePresets.find((item) => item.value === value);
    if (preset) customModuleDialog.title = preset.title;
  }

  function addCustomSection() {
    const preset =
      customModulePresets.find((item) => item.value === customModuleDialog.preset) || customModulePresets[0];

    const sectionType = preset.sectionType || "custom";
    const entryTypes = ["experience", "projects", "education"];
    const entries = preset.entry
      ? [clone(preset.entry)]
      : entryTypes.includes(sectionType)
        ? [createEntry(sectionType)]
        : [];

    sections.value.push({
      id: `${sectionType}-${Date.now()}`,
      type: sectionType,
      title: customModuleDialog.title.trim() || preset.title || sectionTypeLabels[sectionType] || "自定义模块",
      content: preset.content || "",
      skills: preset.skills || "",
      entries,
      styleOverride: emptyStyleOverride(),
      settingsOpen: false,
      removable: true
    });
    customModuleDialog.visible = false;
    ElMessage.success("已新增模块");
  }

  function removeSection(section) {
    sections.value = sections.value.filter((item) => item.id !== section.id);
    ElMessage.success("已删除模块");
  }

  function onPhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      profile.photo.dataUrl = String(reader.result || "");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removePhoto() {
    profile.photo.dataUrl = "";
  }

  return {
    profile,
    sections,
    globalStyle,
    selectedTemplate,
    selectedAccent,
    selectedLayoutMode,
    selectedDateFormat,
    customModuleDialog,
    resetResume,
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
  };
}
