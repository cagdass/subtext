import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import type { TranslationEngine, VideoLayout } from "../types";
import { ENGINES } from "../types";

const LANGUAGES = [
  "Afrikaans","Albanian","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali",
  "Bosnian","Bulgarian","Catalan","Chinese (Simplified)","Chinese (Traditional)","Croatian",
  "Czech","Danish","Dutch","English","Estonian","Finnish","French","Galician","Georgian",
  "German","Greek","Gujarati","Hebrew","Hindi","Hungarian","Icelandic","Indonesian","Irish",
  "Italian","Japanese","Kannada","Kazakh","Korean","Latvian","Lithuanian","Macedonian",
  "Malay","Maltese","Marathi","Mongolian","Nepali","Norwegian","Persian","Polish",
  "Portuguese","Punjabi","Romanian","Russian","Serbian","Slovak","Slovenian","Spanish",
  "Swahili","Swedish","Tamil","Telugu","Thai","Turkish","Ukrainian","Urdu","Uzbek",
  "Vietnamese","Welsh",
];

const LAYOUT_OPTIONS: { id: VideoLayout; label: string; icon: React.ReactNode }[] = [
  { id: "left", label: "Video left", icon: (
    <svg width="18" height="14" viewBox="0 0 18 14"><rect x="0" y="0" width="6" height="14" rx="1" fill="currentColor" opacity="0.8"/><rect x="8" y="0" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"/><rect x="8" y="8" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"/></svg>
  )},
  { id: "right", label: "Video right", icon: (
    <svg width="18" height="14" viewBox="0 0 18 14"><rect x="12" y="0" width="6" height="14" rx="1" fill="currentColor" opacity="0.8"/><rect x="0" y="0" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"/><rect x="0" y="8" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"/></svg>
  )},
  { id: "top", label: "Video top", icon: (
    <svg width="18" height="14" viewBox="0 0 18 14"><rect x="0" y="0" width="18" height="5" rx="1" fill="currentColor" opacity="0.8"/><rect x="0" y="7" width="8" height="7" rx="1" fill="currentColor" opacity="0.4"/><rect x="10" y="7" width="8" height="7" rx="1" fill="currentColor" opacity="0.4"/></svg>
  )},
  { id: "bottom", label: "Video bottom", icon: (
    <svg width="18" height="14" viewBox="0 0 18 14"><rect x="0" y="9" width="18" height="5" rx="1" fill="currentColor" opacity="0.8"/><rect x="0" y="0" width="8" height="7" rx="1" fill="currentColor" opacity="0.4"/><rect x="10" y="0" width="8" height="7" rx="1" fill="currentColor" opacity="0.4"/></svg>
  )},
  { id: "none", label: "Hide video", icon: (
    <svg width="18" height="14" viewBox="0 0 18 14"><rect x="0" y="0" width="8" height="14" rx="1" fill="currentColor" opacity="0.4"/><rect x="10" y="0" width="8" height="14" rx="1" fill="currentColor" opacity="0.4"/></svg>
  )},
];

interface Props {
  isDark: boolean;
  engine: TranslationEngine;
  sourceLang: string;
  targetLang: string;
  videoLayout: VideoLayout;
  isTranslating: boolean;
  progress: number;
  onEngineChange: (e: TranslationEngine) => void;
  onSourceLangChange: (l: string) => void;
  onTargetLangChange: (l: string) => void;
  onVideoLayoutChange: (l: VideoLayout) => void;
  onTranslateAll: () => void;
  onExport: () => void;
  onOpenImport: () => void;
}

function LangDropdown({ value, onChange, isDark }: { value: string; onChange: (v: string) => void; isDark: boolean }) {
  const t = useTheme(isDark);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        style={{
          background: t.bg, border: `1px solid ${open ? t.accent : t.border}`,
          color: t.text, padding: "5px 10px", borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center",
          gap: 6, minWidth: 130, justifyContent: "space-between",
        }}
      >
        <span>{value || "Select..."}</span>
        <span style={{ fontSize: 9, color: t.muted }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, width: 220,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 200, overflow: "hidden",
        }}>
          <input
            autoFocus
            placeholder="Search language..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", background: t.bg,
              border: "none", borderBottom: `1px solid ${t.border}`,
              color: t.text, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, outline: "none",
            }}
          />
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.map(lang => (
              <div key={lang}
                onClick={() => { onChange(lang); setOpen(false); }}
                style={{
                  padding: "7px 12px", fontSize: 11, cursor: "pointer",
                  color: lang === value ? t.accent : t.text,
                  background: "transparent",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = t.accentDim; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {lang}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Toolbar(props: Props) {
  const { isDark, engine, videoLayout, isTranslating, progress } = props;
  const t = useTheme(isDark);

  const btn = (label: string, onClick: () => void, primary = false, disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: primary ? t.accent : "none",
      color: primary ? (isDark ? "#0e0e0f" : "#fff") : t.secondaryText,
      border: primary ? "none" : `1px solid ${t.border}`,
      padding: "6px 14px", borderRadius: 4,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
      fontWeight: primary ? 500 : 400,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.35 : 1,
      whiteSpace: "nowrap", transition: "opacity 0.15s",
    }}
    onMouseEnter={e => { if (!primary && !disabled) { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}}
    onMouseLeave={e => { if (!primary && !disabled) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.secondaryText; }}}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
      borderBottom: `1px solid ${t.border}`, background: t.surface,
      flexShrink: 0, flexWrap: "wrap",
    }}>
      <LangDropdown value={props.sourceLang} onChange={props.onSourceLangChange} isDark={isDark} />
      <span style={{ color: t.muted, fontSize: 13 }}>→</span>
      <LangDropdown value={props.targetLang} onChange={props.onTargetLangChange} isDark={isDark} />

      <div style={{ width: 1, height: 18, background: t.border }} />

      <select value={engine} onChange={e => props.onEngineChange(e.target.value as TranslationEngine)}
        style={{
          background: t.bg, border: `1px solid ${t.border}`, color: t.text,
          padding: "5px 10px", borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: "none", cursor: "pointer",
        }}
      >
        {ENGINES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
      </select>

      <div style={{ flex: 1 }} />

      {/* Layout picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {LAYOUT_OPTIONS.map(opt => (
          <button key={opt.id} title={opt.label}
            onClick={() => props.onVideoLayoutChange(opt.id)}
            style={{
              background: videoLayout === opt.id ? t.accentDim : "transparent",
              border: `1px solid ${videoLayout === opt.id ? t.accent : t.border}`,
              color: videoLayout === opt.id ? t.accent : t.muted,
              borderRadius: 4, padding: "3px 5px", cursor: "pointer",
              display: "flex", alignItems: "center", transition: "all 0.15s",
            }}
          >
            {opt.icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 18, background: t.border }} />

      {btn("⊕ open file", props.onOpenImport)}
      {btn(
        isTranslating ? `${progress}%…` : "Translate all →",
        props.onTranslateAll,
        true,
        isTranslating || engine === "manual"
      )}
      {btn("Export ↓", props.onExport)}
    </div>
  );
}
