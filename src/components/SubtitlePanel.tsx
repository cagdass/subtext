import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import type { SubtitleLine, TranslationEngine } from "../types";

interface Props {
  isDark: boolean;
  lines: SubtitleLine[];
  activeLine: number | null;
  onActiveLine: (i: number) => void;
  onLineChange: (idx: number, patch: Partial<SubtitleLine>) => void;
  onRetranslateLine: (idx: number) => void;
  engine: TranslationEngine;
  sourceLang: string;
  targetLang: string;
  showSeek: boolean;
  onSeek: (ts: string) => void;
  onPlay?: () => void;
}

function TimeInput({ value, onChange, t }: { value: string; onChange: (v: string) => void; t: ReturnType<typeof useTheme> }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  if (editing) {
    return (
      <input
        value={local} autoFocus
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { onChange(local); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === "Enter") { onChange(local); setEditing(false); }
          if (e.key === "Escape") { setLocal(value); setEditing(false); }
        }}
        style={{
          background: "transparent", border: `1px solid ${t.accent}`, color: t.text,
          fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", padding: "1px 4px",
          borderRadius: 3, width: 94, outline: "none",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => { setLocal(value); setEditing(true); }}
      title="Click to edit timing"
      style={{
        fontSize: 9, color: t.muted, cursor: "text", padding: "1px 3px",
        borderRadius: 2, borderBottom: `1px dotted ${t.border}`,
        transition: "color 0.1s, border-color 0.1s",
      }}
      onMouseEnter={e => { e.currentTarget.style.color = t.accent; e.currentTarget.style.borderBottomColor = t.accent; }}
      onMouseLeave={e => { e.currentTarget.style.color = t.muted; e.currentTarget.style.borderBottomColor = t.border; }}
    >
      {value}
    </span>
  );
}

export function SubtitlePanel({
  isDark, lines, activeLine, onActiveLine, onLineChange,
  onRetranslateLine, engine, sourceLang, targetLang, showSeek, onSeek, onPlay,
}: Props) {
  const t = useTheme(isDark);

  const colHeader = (label: string, right?: React.ReactNode) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 14px", borderBottom: `1px solid ${t.border}`,
      fontSize: 10, letterSpacing: 1, color: t.muted, textTransform: "uppercase",
      flexShrink: 0,
    }}>
      <span>{label}</span>
      {right && <span>{right}</span>}
    </div>
  );

  const scrollStyle: React.CSSProperties = {
    overflowY: "auto", flex: 1,
  };

  const renderLine = (line: SubtitleLine, idx: number, isTranslation: boolean) => {
    const isActive = activeLine === idx;
    return (
      <div key={line.id}
        onClick={() => {
          onActiveLine(idx);
          if (showSeek && line.start) onSeek(line.start);
        }}
        onDoubleClick={() => {
          onActiveLine(idx);
          if (showSeek && line.start) onSeek(line.start);
          onPlay?.();
        }}
        style={{
          display: "flex", alignItems: "flex-start", padding: "9px 14px",
          borderBottom: `1px solid ${t.border}`, cursor: "pointer",
          background: isActive ? t.accentDim : "transparent",
          borderLeft: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
          paddingLeft: isActive ? 12 : 14,
          transition: "background 0.1s",
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = t.accentDim; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        <span style={{ color: t.muted, fontSize: 10, minWidth: 20, paddingTop: 2, flexShrink: 0 }}>
          {line.id}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
            <TimeInput value={line.start} onChange={v => onLineChange(idx, { start: v })} t={t} />
            <span style={{ fontSize: 9, color: t.muted }}>→</span>
            <TimeInput value={line.end} onChange={v => onLineChange(idx, { end: v })} t={t} />
            {showSeek && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSeek(line.start);
                  onPlay?.();
                }}
                title="Seek video to this line"
                style={{
                  fontSize: 9, color: t.muted, background: "none", border: "none",
                  cursor: "pointer", padding: "1px 3px", borderRadius: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = t.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = t.muted; }}
              >▶</button>
            )}
          </div>
          {isTranslation ? (
            line.translation
              ? (
                <textarea
                  value={line.translation}
                  onChange={e => { e.stopPropagation(); onLineChange(idx, { translation: e.target.value }); }}
                  rows={isActive ? 2 : 1}
                  style={{
                    background: "transparent", border: "none", color: t.text, width: "100%",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.5,
                    resize: "none", outline: "none",
                  }}
                />
              )
              : (
                <textarea
                  // value={line.translation}
                  placeholder={engine === "manual" ? "Enter translation..." : "Not translated yet"}
                  onChange={e => { e.stopPropagation(); onLineChange(idx, { translation: e.target.value }); }}
                  rows={isActive ? 2 : 1}
                  style={{
                    background: "transparent", border: "none", color: t.text, width: "100%",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.5,
                    resize: "none", outline: "none",
                  }}
                />
              )
          ) : (
            <div style={{ fontSize: 12, lineHeight: 1.5, color: t.text }}>{line.original}</div>
          )}
        </div>

        {/* Per-line actions */}
        {isTranslation && (
          <div style={{ display: "flex", paddingTop: 2, gap: 3, flexShrink: 0, opacity: 0 }}
            className="line-actions"
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
          >
            {engine !== "manual" && (
              <button
                onClick={e => { e.stopPropagation(); onRetranslateLine(idx); }}
                style={{
                  background: "none", border: `1px solid ${t.border}`, color: t.muted,
                  padding: "2px 5px", borderRadius: 3,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.muted; }}
              >↺</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const translated = lines.filter(l => l.translation).length;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Original column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${t.border}` }}>
        {colHeader(`Original · ${sourceLang}`, `${lines.length} lines`)}
        <div style={scrollStyle}>
          {lines.map((line, idx) => renderLine(line, idx, false))}
        </div>
      </div>

      {/* Translation column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {colHeader(`Translation · ${targetLang}`, <span style={{ color: t.accent }}>{translated}/{lines.length}</span>)}
        <div style={scrollStyle}>
          {lines.map((line, idx) => renderLine(line, idx, true))}
        </div>
      </div>
    </div>
  );
}
