// Device template definitions. Safe inset is conservative and to be tuned.
export type Template = {
  id: string;
  label: string;
  device: string;
  canvas: { w: number; h: number };
  safeInset: { top: number; right: number; bottom: number; left: number };
  cornerRadius: 'pill' | number;
  notes?: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "band10",
    label: "Xiaomi Smart Band 10",
    device: "xiaomi_smart_band_10",
    canvas: { w: 212, h: 520 },
    safeInset: { top: 28, right: 14, bottom: 28, left: 14 },
    cornerRadius: "pill", // use pill shape (w/2)
    notes: "Rounded corners; keep text/icons inside safe area.",
  },
  {
    id: "band9",
    label: "Xiaomi Smart Band 9",
    device: "xiaomi_smart_band_9",
    canvas: { w: 192, h: 490 },
    safeInset: { top: 26, right: 12, bottom: 26, left: 12 },
    cornerRadius: "pill",
    notes: "Rounded corners; keep text/icons inside safe area.",
  },
  {
    id: "band8",
    label: "Xiaomi Smart Band 8",
    device: "xiaomi_smart_band_8",
    canvas: { w: 192, h: 490 },
    safeInset: { top: 26, right: 12, bottom: 26, left: 12 },
    cornerRadius: "pill",
    notes: "Pill display; safe area recommended for text/icons.",
  },
];
