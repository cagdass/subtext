import { useState, useEffect, useRef } from "react";
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
import { serialiseSrt } from "./lib/parser";

export type Screen = "editor" | "import" | "settings";

interface HistoryEntry {
  lineIndex: number;
  before: SubtitleLine;
  after: SubtitleLine;
  activeLine: number | null;
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [screen, setScreen] = useState<Screen>("import");
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);
  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const historyIndexRef = useRef(-1);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  const [activeLine, setActiveLine] = useState<number | null>(null);

  const handleLinesChange = (newLines: SubtitleLine[]) => {
    const changedIndex = newLines.findIndex((l, i) => l !== lines[i]);
    if (changedIndex !== -1) {
      const entry: HistoryEntry = {
        lineIndex: changedIndex,
        before: lines[changedIndex],
        after: newLines[changedIndex],
        activeLine,
      };
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setHistory(prev => [...prev.slice(0, historyIndexRef.current + 1), entry]);
        setHistoryIndex(i => i + 1);
      }, 600);
    }
    setLines(newLines);
  };


  // Undo/redo listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex < 0) return; // 👈 < not <=
        const entry = history[historyIndex]; // 👈 not historyIndex - 1
        setLines(prev => {
          const next = [...prev];
          next[entry.lineIndex] = entry.before;
          return next;
        });
        setActiveLine(entry.activeLine);
        setHistoryIndex(i => i - 1);
      }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        if (historyIndex >= history.length - 1) return;
        const entry = history[historyIndex + 1]; // 👈 this one was correct
        setLines(prev => {
          const next = [...prev];
          next[entry.lineIndex] = entry.after;
          return next;
        });
        setActiveLine(entry.activeLine);
        setHistoryIndex(i => i + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [history, historyIndex]);

  // Listen for "open file" events from the main process
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

  // Listen for "export subtitle" events from the main process
  useEffect(() => {
    const unlisten = listen("menu-export", () => handleExport());
    return () => { unlisten.then(f => f()); };
  }, [lines]); // lines in deps so handleExport always has fresh data

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

  // Prevent Escape key from exiting full-screen app,
  // which is a common user action for exiting search mode
  // or disselecting lines, and can be frustrating
  // if it causes the app to exit full-screen.
  useEffect(() => {
    const preventEscFullscreen = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", preventEscFullscreen, { capture: true });
    return () => document.removeEventListener("keydown", preventEscFullscreen, { capture: true });
  }, []);

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

  const handleExport = () => {
    if (lines.length === 0) return;
    const srt = serialiseSrt(lines);
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "translated.srt"; a.click();
    URL.revokeObjectURL(url);
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
      <code>{JSON.stringify(history)}</code>
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
          onLinesChange={handleLinesChange}
          settings={settings}
          onOpenImport={() => setScreen("import")}
          initialVideoUrl={pendingVideoUrl ?? undefined}
          handleExport={handleExport}
          activeLine={activeLine}
          onActiveLineChange={setActiveLine}
        />
      )}
    </div>
  );
}
