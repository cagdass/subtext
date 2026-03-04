import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { parseSubtitles, detectFormat } from "../lib/parser";
import type { SubtitleLine } from "../types";

interface Props {
  isDark: boolean;
  onLoad: (lines: SubtitleLine[]) => void;
}

export function ImportScreen({ isDark, onLoad }: Props) {
  const t = useTheme(isDark);
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Video file — load it and open the editor (subtitle extraction is future work)
    if (file.type.startsWith("video/")) {
      // For now, just open the editor with an empty line set and the video URL stored
      // TODO: extract embedded subtitles via ffmpeg Tauri sidecar
      onLoad([]);
      return;
    }

    const format = detectFormat(file.name);
    if (!format) {
      setError(`Unsupported file type: .${file.name.split(".").pop()}`);
      return;
    }

    const text = await file.text();
    const lines = parseSubtitles(text, format);
    if (lines.length === 0) {
      setError("No subtitle lines found in this file.");
      return;
    }
    onLoad(lines);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePasteLoad = () => {
    if (!pasteText.trim()) return;
    const lines = parseSubtitles(pasteText, "srt");
    if (lines.length === 0) { setError("Could not parse subtitle text."); return; }
    onLoad(lines);
  };

  const s: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, gap: 22, padding: 40,
    background: t.bg,
  };

  return (
    <div style={s}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          // In Tauri this will use dialog.open() — for now a plain input
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".srt,.vtt,.ass,.sub,.mp4,.mkv,.mov,.avi";
          input.onchange = () => { if (input.files?.[0]) handleFile(input.files[0]); };
          input.click();
        }}
        style={{
          width: "100%", maxWidth: 460,
          border: `2px dashed ${dragOver ? t.accent : t.border}`,
          borderRadius: 8, padding: "40px 32px", textAlign: "center",
          background: dragOver ? t.accentDim : "transparent",
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.accent; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = dragOver ? t.accent : t.border; }}
      >
        <div style={{ fontSize: 24, marginBottom: 10 }}>⬇</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 5 }}>
          Drop a file here
        </div>
        <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.7 }}>
          Subtitle: .srt · .vtt · .ass · .sub<br />
          Video: .mp4 · .mkv · .mov · .avi
        </div>
      </div>

      <div style={{ fontSize: 11, color: t.muted }}>— or paste subtitle text —</div>

      <textarea
        value={pasteText}
        onChange={e => setPasteText(e.target.value)}
        placeholder={"1\n00:00:01,000 --> 00:00:03,200\nPaste your subtitle text here..."}
        style={{
          width: "100%", maxWidth: 460, background: t.surface,
          border: `1px solid ${t.border}`, borderRadius: 8,
          padding: 14, fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12, color: t.text, resize: "none",
          outline: "none", minHeight: 90,
          transition: "border-color 0.15s",
        }}
        onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = t.accent; }}
        onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = t.border; }}
      />

      {error && (
        <div style={{ color: "#f87171", fontSize: 11 }}>{error}</div>
      )}

      <button
        onClick={handlePasteLoad}
        disabled={!pasteText.trim()}
        style={{
          background: t.accent, color: isDark ? "#0e0e0f" : "#fff",
          border: "none", padding: "6px 20px", borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          fontWeight: 500, cursor: "pointer", opacity: pasteText.trim() ? 1 : 0.35,
        }}
      >
        Load →
      </button>
    </div>
  );
}
