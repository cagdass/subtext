// ─── Subtitle ────────────────────────────────────────────────────────────────

export interface SubtitleLine {
  id: number;
  start: string; // "HH:MM:SS,mmm"
  end: string;
  original: string;
  translation: string;
}

export type SubtitleFormat = "srt" | "vtt" | "ass" | "sub";

// ─── Translation ─────────────────────────────────────────────────────────────

export type TranslationEngine =
  | "claude"
  | "deepl"
  | "openai"
  | "google"
  | "manual";

export interface TranslationEngineConfig {
  id: TranslationEngine;
  label: string;
  requiresKey: boolean;
}

export const ENGINES: TranslationEngineConfig[] = [
  { id: "claude",  label: "Claude",  requiresKey: true },
  { id: "deepl",   label: "DeepL",   requiresKey: true },
  { id: "openai",  label: "OpenAI",  requiresKey: true },
  { id: "google",  label: "Google",  requiresKey: true },
  { id: "manual",  label: "Manual",  requiresKey: false },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

export type VideoLayout = "left" | "right" | "top" | "bottom" | "none";

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: "dark" | "light" | "system";
  apiKeys: Partial<Record<TranslationEngine, string>>;
  defaultEngine: TranslationEngine;
  defaultSourceLang: string;
  defaultTargetLang: string;
  videoLayout: VideoLayout;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  apiKeys: {},
  defaultEngine: "claude",
  defaultSourceLang: "English",
  defaultTargetLang: "",
  videoLayout: "left",
};
