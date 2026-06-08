import { computed, nextTick, onMounted, ref } from "vue";
import { createPreviewPage } from "../utils/resumeHelpers";

export function useResumePagination(previewUnits) {
  const previewRef = ref(null);
  const measureRef = ref(null);
  const headerMeasureRef = ref(null);
  const previewPages = ref([]);

  const renderedPages = computed(() =>
    previewPages.value.length
      ? previewPages.value
      : [{ id: "page-1", number: 1, showHeader: true, units: previewUnits.value }]
  );

  let paginationRun = 0;

  function schedulePagination() {
    void paginatePreview();
  }

  async function paginatePreview() {
    const run = ++paginationRun;
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (run !== paginationRun) return;

    const measurePaper = measureRef.value;
    const header = headerMeasureRef.value;
    const body = measurePaper?.querySelector(".resume-body");
    if (!measurePaper || !header || !body) {
      previewPages.value = [{ id: "page-1", number: 1, showHeader: true, units: previewUnits.value }];
      return;
    }

    const units = previewUnits.value;
    if (!units.length) {
      previewPages.value = [{ id: "page-1", number: 1, showHeader: true, units: [] }];
      return;
    }

    const paperStyles = getComputedStyle(measurePaper);
    const bodyStyles = getComputedStyle(body);
    const pageContentHeight =
      measurePaper.clientHeight -
      parseFloat(paperStyles.paddingTop) -
      parseFloat(paperStyles.paddingBottom);
    const firstPageLimit =
      pageContentHeight - header.getBoundingClientRect().height - parseFloat(bodyStyles.paddingTop);
    const nextPageLimit = pageContentHeight;
    const unitHeights = Array.from(measurePaper.querySelectorAll("[data-measure-unit]")).map(
      (element) => {
        const style = getComputedStyle(element);
        return element.getBoundingClientRect().height + parseFloat(style.marginBottom || "0");
      }
    );

    const pages = [];
    let currentPage = createPreviewPage(1, true);
    let currentLimit = Math.max(0, firstPageLimit);
    let usedHeight = 0;

    units.forEach((unit, index) => {
      const height = unitHeights[index] || 0;
      const shouldMove =
        currentPage.units.length > 0 && usedHeight + height > currentLimit && pages.length < 20;

      if (shouldMove) {
        pages.push(currentPage);
        currentPage = createPreviewPage(pages.length + 1, false);
        currentLimit = nextPageLimit;
        usedHeight = 0;
      }

      currentPage.units.push(unit);
      usedHeight += height;
    });

    pages.push(currentPage);
    previewPages.value = pages;
  }

  function setPreviewRef(element) {
    previewRef.value = element;
  }

  function setMeasureRef(element) {
    measureRef.value = element;
  }

  function setHeaderMeasureRef(element) {
    headerMeasureRef.value = element;
  }

  onMounted(() => {
    schedulePagination();
  });

  return {
    previewRef,
    previewPages,
    renderedPages,
    schedulePagination,
    paginatePreview,
    setPreviewRef,
    setMeasureRef,
    setHeaderMeasureRef
  };
}
