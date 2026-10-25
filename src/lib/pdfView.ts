export const PDF_URL = "/assets/projects/source.pdf";
export const PDF_WORKER = "/assets/projects/pdf.worker.min.mjs";
export const PDF_FONT_URL = "/assets/projects/standard_fonts/";
export const PDF_CMAP_URL = "/assets/projects/cmaps/";
export const READING_WIDTH = 850;
export const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5] as const;

export function fitPageWidth(containerWidth: number, mobile: boolean) {
  const available = Math.max(0, containerWidth - 32);
  if (mobile) return available;
  return Math.min(READING_WIDTH, available);
}

export function spreadStart(page: number) {
  return page - (page % 2);
}

export function stepZoom(zoom: number, direction: "in" | "out") {
  const index = ZOOM_STEPS.indexOf(zoom as (typeof ZOOM_STEPS)[number]);
  const current = index === -1 ? 0 : index;
  const next = direction === "in" ? current + 1 : current - 1;
  return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, next))];
}
