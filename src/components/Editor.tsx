import { useState, useRef, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { SubtitlePanel } from "./SubtitlePanel";
import { VideoPanel } from "./VideoPanel";
import { Toolbar } from "./Toolbar";
import { translateLines } from "../lib/translator";
import { serialiseSrt } from "../lib/parser";
import type { SubtitleLine, AppSettings, VideoLayout, TranslationEngine } from "../types";
import { ENGINES } from "../types";

interface Props {
  isDark: boolean;
  lines: SubtitleLine[];
  onLinesChange: (lines: SubtitleLine[]) => void;
  settings: AppSettings;
  onOpenImport: () => void;
}

type SubtitleDisplay = "off" | "source" | "target";

export function Editor({ isDark, lines, onLinesChange, settings, onOpenImport }: Props) {
  const t = useTheme(isDark);
  const [engine, setEngine] = useState<TranslationEngine>(settings.defaultEngine);
  const [sourceLang, setSourceLang] = useState(settings.defaultSourceLang || "English");
  const [targetLang, setTargetLang] = useState(settings.defaultTargetLang || "");
  const [videoLayout, setVideoLayout] = useState<VideoLayout>(settings.videoLayout);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [videoSize, setVideoSize] = useState(320);
  const [subtitleDisplay, setSubtitleDisplay] = useState<SubtitleDisplay>("target");
  const mainRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to map language names to BCP-47 codes
  const langToCode = (lang: string) => {
    const l = (lang || "").toLowerCase();
    if (l.startsWith("tur")) return "tr";
    if (l.startsWith("gre") || l.startsWith("ell") || l.startsWith("ελλ") || l.startsWith("ελ")) return "el";
    if (l.startsWith("eng")) return "en";
    return "en";
  };

  const updateLine = (idx: number, patch: Partial<SubtitleLine>) => {
    const next = [...lines];
    next[idx] = { ...next[idx], ...patch };
    onLinesChange(next);
  };

  const handleTranslateAll = async () => {
    const apiKey = settings.apiKeys[engine] ?? "";
    setIsTranslating(true);
    setProgress(0);
    try {
      await translateLines({
        engine,
        apiKey,
        sourceLang,
        targetLang,
        lines: lines.map(l => l.original),
        onProgress: (i, translation) => {
          updateLine(i, { translation });
          setProgress(Math.round(((i + 1) / lines.length) * 100));
        },
      });
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
      setProgress(100);
    }
  };

  const handleRetranslateLine = async (idx: number) => {
    const apiKey = settings.apiKeys[engine] ?? "";
    updateLine(idx, { translation: "" });
    try {
      const [translation] = await translateLines({
        engine, apiKey, sourceLang, targetLang,
        lines: [lines[idx].original],
      });
      updateLine(idx, { translation });
    } catch (err) {
      console.error("Re-translate error:", err);
    }
  };

  const handleExport = () => {
    const srt = serialiseSrt(lines);
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "translated.srt"; a.click();
    URL.revokeObjectURL(url);
  };

  const seekVideo = (timeStr: string) => {
    if (!videoRef.current) return;
    const p = timeStr.split(/[:,]/);
    if (p.length < 4) return;
    videoRef.current.currentTime = +p[0] * 3600 + +p[1] * 60 + +p[2] + +p[3] / 1000;
  };

  // ── Resizable divider ──
  const handleDividerDrag = useCallback((clientPos: number) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const isH = videoLayout === "top" || videoLayout === "bottom";
    if (isH) {
      const rel = clientPos - rect.top;
      const clamped = Math.max(100, Math.min(rect.height - 100, rel));
      setVideoSize(videoLayout === "top" ? clamped : rect.height - clamped);
    } else {
      const rel = clientPos - rect.left;
      const clamped = Math.max(180, Math.min(rect.width - 300, rel));
      setVideoSize(videoLayout === "left" ? clamped : rect.width - clamped);
    }
  }, [videoLayout]);

  const makeDivider = (direction: "h" | "v") => {
    const isV = direction === "v";
    let dragging = false;
    const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      dragging = true;
      const move = (ev: MouseEvent) => { if (dragging) handleDividerDrag(isV ? ev.clientX : ev.clientY); };
      const up = () => { dragging = false; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    return (
      <div onMouseDown={onMouseDown} style={{
        [isV ? "width" : "height"]: 5,
        [isV ? "minHeight" : "minWidth"]: "100%",
        cursor: isV ? "col-resize" : "row-resize",
        flexShrink: 0, position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          [isV ? "width" : "height"]: 1,
          [isV ? "height" : "width"]: "100%",
          background: t.border, pointerEvents: "none",
        }} />
      </div>
    );
  };

  const videoPanel = (
    <VideoPanel
      isDark={isDark}
      videoUrl={videoUrl}
      videoRef={videoRef}
      layout={videoLayout}
      size={videoSize}
      onLoad={(url) => setVideoUrl(url)}
      onClose={() => setVideoUrl(null)}
      subtitleSrt={subtitleDisplay === "source" ? serialiseSrt(lines.map(l => ({ ...l, translation: l.original }))) : subtitleDisplay === "target" ? serialiseSrt(lines.map(l => ({ ...l, original: l.translation }))) : null}
      subtitleLabel={targetLang ? `${targetLang} (live)` : "Subtitles"}
      subtitleLang={langToCode(targetLang || sourceLang)}
      showSubtitles={subtitleDisplay !== "off"}
      subtitleDisplay={subtitleDisplay}
      onSubtitleDisplayChange={setSubtitleDisplay}
    />
  );

  const subtitlePanel = (
    <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <SubtitlePanel
        isDark={isDark}
        lines={lines}
        activeLine={activeLine}
        onActiveLine={setActiveLine}
        onLineChange={updateLine}
        onRetranslateLine={handleRetranslateLine}
        engine={engine}
        sourceLang={sourceLang}
        targetLang={targetLang}
        showSeek={!!videoUrl}
        onSeek={seekVideo}
        onPlay={() => {
          if (!videoRef.current) return;
          videoRef.current.play().catch(() => { });
        }}
      />
    </div>
  );

  const isH = videoLayout === "top" || videoLayout === "bottom";
  const showVideo = videoLayout !== "none";

  const renderLayout = () => {
    if (!showVideo) return subtitlePanel;
    const divider = makeDivider(isH ? "h" : "v");
    if (videoLayout === "left") return <>{videoPanel}{divider}{subtitlePanel}</>;
    if (videoLayout === "right") return <>{subtitlePanel}{divider}{videoPanel}</>;
    if (videoLayout === "top") return <>{videoPanel}{divider}{subtitlePanel}</>;
    if (videoLayout === "bottom") return <>{subtitlePanel}{divider}{videoPanel}</>;
  };

  const translated = lines.filter(l => l.translation).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Toolbar
        isDark={isDark}
        engine={engine}
        sourceLang={sourceLang}
        targetLang={targetLang}
        videoLayout={videoLayout}
        isTranslating={isTranslating}
        progress={progress}
        onEngineChange={setEngine}
        onSourceLangChange={setSourceLang}
        onTargetLangChange={setTargetLang}
        onVideoLayoutChange={setVideoLayout}
        onTranslateAll={handleTranslateAll}
        onExport={handleExport}
        onOpenImport={onOpenImport}
      />

      {/* Progress bar */}
      <div style={{ height: 2, background: t.border, flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: t.accent, transition: "width 0.3s ease" }} />
      </div>

      {/* Main area */}
      <div ref={mainRef} style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: isH ? "column" : "row" }}>
        {renderLayout()}
      </div>

      {/* Status bar */}
      <div style={{
        height: 22, borderTop: `1px solid ${t.border}`, background: t.surface,
        display: "flex", alignItems: "center", padding: "0 14px",
        gap: 12, fontSize: 10, color: t.muted, flexShrink: 0,
      }}>
        <span>{ENGINES.find(e => e.id === engine)?.label}</span>
        <span>·</span>
        <span>{sourceLang || "?"} → {targetLang || "?"}</span>
        <span>·</span>
        <span>{translated}/{lines.length} translated</span>
        {progress === 100 && <><span>·</span><span style={{ color: t.accent }}>✓ done</span></>}
      </div>
    </div>
  );
}
