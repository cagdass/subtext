import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { parseSubtitles, detectFormat } from "./parser";
import type { SubtitleLine } from "../types";

export async function handleFilePath(
  path: string,
  onLines: (lines: SubtitleLine[]) => void,
  onVideo: (url: string) => void,
) {
  const isVideo = /\.(mp4|mkv|mov|avi)$/i.test(path);
  if (isVideo) {
    onVideo(convertFileSrc(path)); // Tauri-safe URL
    return;
  }

  const format = detectFormat(path);
  if (!format) return;

  const bytes = await readFile(path);
  const text = new TextDecoder().decode(bytes);
  const lines = parseSubtitles(text, format);
  if (lines.length > 0) onLines(lines);
}

export async function handleFileObject(
  file: File,
  onLines: (lines: SubtitleLine[]) => void,
  onVideo: (url: string) => void,
) {
  if (file.type.startsWith("video/")) {
    onVideo(URL.createObjectURL(file));
    return;
  }

  const format = detectFormat(file.name);
  if (!format) return;

  const text = await file.text();
  const lines = parseSubtitles(text, format);
  if (lines.length > 0) onLines(lines);
}