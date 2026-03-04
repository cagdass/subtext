import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { ImportScreen } from "./components/ImportScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { Titlebar } from "./components/Titlebar";
import { loadSettings, saveSettings } from "./lib/settings";
import type { AppSettings, SubtitleLine } from "./types";

export type Screen = "editor" | "import" | "settings";

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [screen, setScreen] = useState<Screen>("import");
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [isDark, setIsDark] = useState(true);

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
          onLoad={(loadedLines) => {
            setLines(loadedLines);
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
        />
      )}
    </div>
  );
}
