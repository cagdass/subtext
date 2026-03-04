export interface Theme {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentDim: string;
  secondaryText: string;
  videoPanel: string;
}

const DARK: Theme = {
  bg: "#0e0e0f",
  surface: "#18181b",
  border: "#2a2a2e",
  text: "#e8e8e8",
  muted: "#555",
  accent: "#c8f150",
  accentDim: "#c8f15018",
  secondaryText: "#888",
  videoPanel: "#0a0a0b",
};

const LIGHT: Theme = {
  bg: "#f5f4f0",
  surface: "#ffffff",
  border: "#e0dfd8",
  text: "#1a1a1a",
  muted: "#bbb",
  accent: "#3a7d00",
  accentDim: "#3a7d0012",
  secondaryText: "#666",
  videoPanel: "#e2e1dc",
};

export function useTheme(isDark: boolean): Theme {
  return isDark ? DARK : LIGHT;
}
