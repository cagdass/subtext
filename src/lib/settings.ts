/**
 * Settings persistence via localStorage for now.
 * In production this will use @tauri-apps/plugin-store for native key-value storage.
 * The interface is the same — swap the implementation when ready.
 */

import type { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const SETTINGS_KEY = "subtext_settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.warn("Failed to save settings");
  }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
  return updated;
}
