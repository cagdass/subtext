import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { ImportScreen } from "./components/ImportScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { Titlebar } from "./components/Titlebar";
import { loadSettings, saveSettings } from "./lib/settings";
import type { AppSettings, SubtitleLine } from "./types";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { handleFilePath } from "./lib/fileHandler";
import { log } from "./lib/log";

export type Screen = "editor" | "import" | "settings";

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [screen, setScreen] = useState<Screen>("import");
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);




  useEffect(() => {
    const unlisten = listen("menu-open-file", async () => {
      const path = await open({
        multiple: false,
        filters: [{ name: "Subtitles & Video", extensions: ["srt", "vtt", "ass", "sub", "mp4", "mkv", "mov", "avi"] }],
      });
      if (!path) return;

      await handleFilePath(
        path as string,
        (lines) => { setLines(lines); setScreen("editor"); },
        (url) => { setPendingVideoUrl(url); setScreen("editor"); },
      );
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  // Resolve system theme preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      if (settings.theme === "system") setIsDark(mq.matches);
      else setIsDark(settings.theme === "dark");
    };
    resolve();
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [settings.theme]);

  const updateSettings = (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    updateSettings({ theme: next });
    setIsDark(!isDark);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: isDark ? "#0e0e0f" : "#f5f4f0",
        color: isDark ? "#e8e8e8" : "#1a1a1a",
        transition: "background 0.2s, color 0.2s",
        overflow: "hidden",
      }}
    >
      <Titlebar
        isDark={isDark}
        screen={screen}
        onNavigate={setScreen}
        onToggleTheme={toggleTheme}
      />

      {screen === "import" && (
        <ImportScreen
          isDark={isDark}
          onLoad={(loadedLines, videoUrl) => {
            if (loadedLines.length > 0) setLines(loadedLines);
            if (videoUrl !== undefined) setPendingVideoUrl(videoUrl);
            setScreen("editor");
          }}
        />
      )}

      {screen === "settings" && (
        <SettingsScreen
          isDark={isDark}
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setScreen("editor")}
        />
      )}

      {screen === "editor" && (
        <Editor
          isDark={isDark}
          lines={lines}
          onLinesChange={setLines}
          settings={settings}
          onOpenImport={() => setScreen("import")}
          initialVideoUrl={pendingVideoUrl ?? undefined}
        />
      )}
    </div>
  );
}
