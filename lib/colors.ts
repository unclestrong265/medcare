export const lightColors = {
  appBackground: "#DCE6F1",
  surface: "#FFFFFF",
  card: "#F7F7F7",
  header: "#E77B5D",
  headerTextMuted: "rgba(255, 255, 255, 0.85)",
  orbs: {
    peach: "#F4C3B0",
    apricot: "#F7D6A6",
    mint: "#B9E3C8",
  },
  headerOrbs: {
    sand: "#F2C48F",
    mint: "#9AD8B4",
  },
  text: {
    primary: "#2F2F2F",
    secondary: "#6B6B6B",
    muted: "#7B7B7B",
    subtle: "#9B9B9B",
    inverse: "#FFFFFF",
  },
  border: {
    light: "#ECECEC",
    subtle: "#E6E6E6",
  },
  accent: {
    dark: "#111111",
    success: "#2E6B39",
    error: "#C83434",
  },
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export const darkColors = {
  appBackground: "#0F161C",
  surface: "#172029",
  card: "#1D2731",
  header: "#E77B5D",
  headerTextMuted: "rgba(255, 255, 255, 0.78)",
  orbs: {
    peach: "#5A2E24",
    apricot: "#5C3A24",
    mint: "#1E3A2C",
  },
  headerOrbs: {
    sand: "#D39A73",
    mint: "#76C2A2",
  },
  text: {
    primary: "#F5F7FA",
    secondary: "#CAD2DA",
    muted: "#A9B3BC",
    subtle: "#8C98A2",
    inverse: "#FFFFFF",
  },
  border: {
    light: "#2A3642",
    subtle: "#22303C",
  },
  accent: {
    dark: "#E77B5D",
    success: "#6ED08C",
    error: "#E06A6A",
  },
  overlay: "rgba(0, 0, 0, 0.6)",
} as const;

export type ThemeColors = typeof lightColors;

export const colors = lightColors;
