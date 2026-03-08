import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { SubtitlePanel } from "./SubtitlePanel";
import { VideoPanel } from "./VideoPanel";
import { Toolbar } from "./Toolbar";
import { translateLines } from "../lib/translator";
import { serialiseSrt } from "../lib/parser";
import type { SubtitleLine, AppSettings, VideoLayout, TranslationEngine } from "../types";
import { ENGINES } from "../types";
import { log, error } from "../lib/log";

interface Props {
  isDark: boolean;
  lines: SubtitleLine[];
  onLinesChange: (lines: SubtitleLine[]) => void;
  settings: AppSettings;
  onOpenImport: () => void;
  initialVideoUrl?: string;
  handleExport: () => void;
}

type SubtitleDisplay = "off" | "source" | "target";

function timeStrToSeconds(timeStr: string): number {
  const p = timeStr.trim().split(/[:,]/);
  if (p.length < 4) return 0;
  return +p[0] * 3600 + +p[1] * 60 + +p[2] + +p[3] / 1000;
}

export function Editor({ isDark, lines, onLinesChange, settings, onOpenImport, initialVideoUrl, handleExport }: Props) {
  const t = useTheme(isDark);
  const [engine, setEngine] = useState<TranslationEngine>(settings.defaultEngine);
  const [sourceLang, setSourceLang] = useState(settings.defaultSourceLang || "English");
  const [targetLang, setTargetLang] = useState(settings.defaultTargetLang || "");
  const [videoLayout, setVideoLayout] = useState<VideoLayout>(settings.videoLayout);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl ?? null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [videoSize, setVideoSize] = useState(320);
  const [subtitleDisplay, setSubtitleDisplay] = useState<SubtitleDisplay>("target");
  const mainRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Keep track of activeLine in a ref for keyboard navigation
  // to avoid stale closures
  const activeLineRef = useRef(activeLine);
  useEffect(() => { activeLineRef.current = activeLine; }, [activeLine]);
  // For find in page functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const linesRef = useRef(lines);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  const matchesSearch = (line: SubtitleLine, query: string) => {
    const q = query.toLowerCase();
    return (
      line.original?.toLowerCase().includes(q) ||
      line.translation?.toLowerCase().includes(q)
    );
  };

  // log(`Editor:videoUrl=${videoUrl}`);

  // Auto-detect active subtitle line based on video time to highlight it
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const updateActive = () => {
      const t = v.currentTime;

      // Binary search would be more efficient for large files,
      // but linear scan is simpler and subtitle files are usually not huge
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Convert "HH:MM:SS,mmm" to seconds
        const p = line.start.split(/[:,]/);
        const start =
          +p[0] * 3600 +
          +p[1] * 60 +
          +p[2] +
          +p[3] / 1000;


        const p2 = line.end.split(/[:,]/);
        const end =
          +p2[0] * 3600 +
          +p2[1] * 60 +
          +p2[2] +
          +p2[3] / 1000;

        // Check if current video time is within the subtitle line's time range
        if (t >= start && t <= end) {
          setActiveLine(i);
          break;
        }
      }
    };

    v.addEventListener("timeupdate", updateActive);

    return () => {
      v.removeEventListener("timeupdate", updateActive);
    };
  }, [lines]);

  const timings = useMemo(() => {
    return lines.map((l) => ({
      start: timeStrToSeconds(l.start),
      end: timeStrToSeconds(l.end),
    }));
  }, [lines]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;

    const updateActive = () => {
      const t = v.currentTime;

      // simple linear scan (fine for MVP)
      let found = -1;
      for (let i = 0; i < timings.length; i++) {
        const { start, end } = timings[i];
        if (t >= start && t <= end) {
          found = i;
          break;
        }
      }

      // avoid re-setting state every tick
      if (found !== -1) {
        setActiveLine((prev) => (prev === found ? prev : found));
      }
    };

    // update immediately + on changes
    updateActive();
    v.addEventListener("timeupdate", updateActive);
    v.addEventListener("seeked", updateActive);
    v.addEventListener("loadedmetadata", updateActive);

    return () => {
      v.removeEventListener("timeupdate", updateActive);
      v.removeEventListener("seeked", updateActive);
      v.removeEventListener("loadedmetadata", updateActive);
    };
  }, [videoUrl, timings]);

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
      error("Translation error:", err);
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
      error("Re-translate error:", err);
    }
  };

  const seekVideo = (timeStr: string) => {
    if (!videoRef.current) return;
    const p = timeStr.split(/[:,]/);
    if (p.length < 4) return;
    videoRef.current.currentTime = +p[0] * 3600 + +p[1] * 60 + +p[2] + +p[3] / 1000;
  };

  // ── Keyboard navigation ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Jump by 1
      if (e.key === "ArrowDown" && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.min(prev + 1, lines.length - 1));

      } else if (e.key === "ArrowUp" && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.max(prev - 1, 0));

        // Jump by 10
      } else if (e.key === "ArrowDown" && e.shiftKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.min(prev + 10, lines.length - 1));

      } else if (e.key === "ArrowUp" && e.shiftKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.max(prev - 10, 0));

        // Jump by 50
      } else if (e.key === "ArrowDown" && e.metaKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.min(prev + 50, lines.length - 1));

      } else if (e.key === "ArrowUp" && e.metaKey) {
        e.preventDefault();
        setActiveLine(prev => prev === null ? 0 : Math.max(prev - 50, 0));

        // Tab → next untranslated
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const current = activeLineRef.current;
        const start = current === null ? 0 : current + 1;
        let idx = lines.findIndex((l, i) => i >= start && !l.translation?.trim());
        if (idx === -1) idx = lines.findIndex(l => !l.translation?.trim()); // wrap
        if (idx !== -1) setActiveLine(idx);
        // Shift + Tab → previous untranslated
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const current = activeLineRef.current;
        const start = current === null ? lines.length - 1 : current - 1;
        let idx = -1;
        for (let i = start; i >= 0; i--) {
          if (!lines[i].translation?.trim()) { idx = i; break; }
        }
        if (idx === -1) {
          for (let i = lines.length - 1; i > start; i--) {
            if (!lines[i].translation?.trim()) { idx = i; break; }
          }
        }
        if (idx !== -1) setActiveLine(idx);

      }

      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(""); }
        else setActiveLine(null);
      }
      if (e.key === "Enter" && searchOpen && searchQuery) {
        e.preventDefault();
        // cycle to next/prev match
        const matches = linesRef.current
          .map((l, i) => i)
          .filter(i => matchesSearch(linesRef.current[i], searchQuery));
        if (!matches.length) return;
        const next = e.shiftKey
          ? (searchMatchIndex - 1 + matches.length) % matches.length
          : (searchMatchIndex + 1) % matches.length;
        setSearchMatchIndex(next);
        setActiveLine(matches[next]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lines.length]);

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
        searchQuery={searchQuery}
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

      {/* Search bar */}
      {searchOpen && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderBottom: `1px solid ${t.border}`,
          background: t.surface, flexShrink: 0,
        }}>
          <input
            autoFocus
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchMatchIndex(0); }}
            onKeyDown={e => {
              if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
              if (e.key === "Enter") {
                const matches = lines.map((l, i) => i).filter(i => matchesSearch(lines[i], searchQuery));
                if (!matches.length) return;
                const next = e.shiftKey
                  ? (searchMatchIndex - 1 + matches.length) % matches.length
                  : (searchMatchIndex + 1) % matches.length;
                setSearchMatchIndex(next);
                setActiveLine(matches[next]);
              }
            }}
            placeholder="Search lines…"
            style={{
              background: "transparent", border: `1px solid ${t.border}`,
              borderRadius: 4, color: t.text, padding: "3px 8px",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              outline: "none", width: 220,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
            onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
          />
          {searchQuery && (
            <span style={{ fontSize: 10, color: t.muted }}>
              {(() => {
                const matches = lines.map((l, i) => i).filter(i => matchesSearch(lines[i], searchQuery));
                return matches.length ? `${searchMatchIndex + 1} / ${matches.length}` : "no matches";
              })()}
            </span>
          )}
          <button
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", fontSize: 12 }}
          >✕</button>
        </div>
      )}


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
