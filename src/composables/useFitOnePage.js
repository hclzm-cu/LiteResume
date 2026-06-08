import { ref } from "vue";
import { clone } from "../utils/resumeHelpers";

export function useFitOnePage({ globalStyle, sections, previewPages, paginatePreview, schedulePagination }) {
  const isFitting = ref(false);
  const fitSnapshot = ref(null);
  const fitMessage = ref("");

  async function fitResumeToOnePage() {
    if (isFitting.value) return;
    fitSnapshot.value = {
      globalStyle: clone(globalStyle),
      sections: clone(sections.value)
    };
    fitMessage.value = "";
    isFitting.value = true;

    try {
      await paginatePreview();
      for (let step = 0; step < 28 && isOverflowing(); step += 1) {
        if (globalStyle.sectionSpacing > 8) {
          globalStyle.sectionSpacing = Math.max(8, globalStyle.sectionSpacing - 2);
        } else if (globalStyle.lineHeight > 1.35) {
          globalStyle.lineHeight = Number(Math.max(1.35, globalStyle.lineHeight - 0.04).toFixed(2));
        } else if (globalStyle.baseFontSize > 11) {
          globalStyle.baseFontSize = Number(Math.max(11, globalStyle.baseFontSize - 0.25).toFixed(2));
        } else {
          break;
        }
        await paginatePreview();
      }

      fitMessage.value = isOverflowing()
        ? `仍然超过一页，建议精简：${suggestSectionsToTrim().join("、") || "最长的工作/项目描述"}。`
        : "已通过温和压缩调整到一页范围内。";
    } finally {
      isFitting.value = false;
    }
  }

  function undoFit() {
    if (!fitSnapshot.value) return;
    Object.assign(globalStyle, clone(fitSnapshot.value.globalStyle));
    sections.value = clone(fitSnapshot.value.sections);
    fitSnapshot.value = null;
    fitMessage.value = "已撤销智能一页调整。";
    schedulePagination();
  }

  function clearFitState() {
    fitSnapshot.value = null;
    fitMessage.value = "";
  }

  function isOverflowing() {
    return previewPages.value.length > 1;
  }

  function suggestSectionsToTrim() {
    return sections.value
      .map((section) => ({
        title: section.title,
        size:
          section.content.length +
          section.skills.length +
          section.entries.reduce((sum, entry) => sum + entry.details.length + entry.organization.length, 0)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 2)
      .map((item) => item.title);
  }

  return {
    isFitting,
    fitSnapshot,
    fitMessage,
    fitResumeToOnePage,
    undoFit,
    clearFitState
  };
}
