import { useTheme } from "../hooks/useTheme";
import type { VideoLayout } from "../types";
import { srtToVtt } from "../lib/srtToVtt";
import { useEffect, useState } from "react";


interface Props {
  isDark: boolean;
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  layout: VideoLayout;
  size: number;
  onLoad: (url: string) => void;
  onClose: () => void;

  subtitleLabel?: string;
  subtitleLang?: string;
  subtitleSrt?: string | null;
  showSubtitles?: boolean;

  subtitleDisplay?: "off" | "source" | "target";
  onSubtitleDisplayChange?: (v: "off" | "source" | "target") => void;
}

export function VideoPanel({
  isDark,
  videoUrl,
  videoRef,
  layout,
  size,
  onLoad,
  onClose,
  subtitleSrt = null,
  subtitleLabel = "Subtitles",
  subtitleLang = "en",
  showSubtitles = true,
  subtitleDisplay = "target",
  onSubtitleDisplayChange,
}: Props) {
  const t = useTheme(isDark);
  const isH = layout === "top" || layout === "bottom";
  const [trackUrl, setTrackUrl] = useState<string | null>(null);

  // useEffect(() => {
  //   console.log("[VideoPanel props]", {
  //     hasVideo: !!videoUrl,
  //     subtitleLen: subtitleSrt?.length ?? 0,
  //     subtitlePreview: subtitleSrt?.slice(0, 120),
  //     subtitleLang,
  //     subtitleLabel,
  //     showSubtitles,
  //   });
  // }, [videoUrl, subtitleSrt, subtitleLang, subtitleLabel, showSubtitles]);

  // Build a VTT blob URL whenever subtitleSrt changes
  useEffect(() => {
    if (!subtitleSrt || !showSubtitles) {
      setTrackUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const vtt = srtToVtt(subtitleSrt);
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);

    setTrackUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [subtitleSrt, showSubtitles]);

  // Force the track to show (some engines attach it a moment after render)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const ensureShowing = () => {
      const tracks = v.textTracks;
      if (!tracks || tracks.length === 0) return;
      tracks[0].mode = showSubtitles ? "showing" : "disabled";
    };

    // Try immediately and again shortly after to catch async attachment.
    ensureShowing();
    const t1 = window.setTimeout(ensureShowing, 0);
    const t2 = window.setTimeout(ensureShowing, 200);

    const onLoaded = () => ensureShowing();
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("loadeddata", onLoaded);

    // Some engines fire addtrack on the TextTrackList
    const ttl: any = v.textTracks as any;
    const onAddTrack = () => ensureShowing();
    ttl?.addEventListener?.("addtrack", onAddTrack);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("loadeddata", onLoaded);
      ttl?.removeEventListener?.("addtrack", onAddTrack);
    };
  }, [trackUrl, showSubtitles, videoRef]);

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = () => {
      if (input.files?.[0]) {
        onLoad(URL.createObjectURL(input.files[0]));
      }
    };
    input.click();
  };

  return (
    <div style={{
      position: "relative",
      background: t.videoPanel,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
      ...(isH ? { height: size } : { width: size }),
    }}>
      {/* Header */}
      <div style={{
        padding: "7px 12px", borderBottom: `1px solid ${t.border}`,
        fontSize: 10, letterSpacing: 1, textTransform: "uppercase" as const,
        color: t.muted, display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Video</span>

          {videoUrl && onSubtitleDisplayChange && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase" as const, color: t.muted }}>
                subs
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => onSubtitleDisplayChange("off")}
                  style={{
                    background: subtitleDisplay === "off" ? t.surface : "none",
                    border: `1px solid ${t.border}`,
                    color: subtitleDisplay === "off" ? t.secondaryText : t.muted,
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    cursor: "pointer",
                  }}
                >
                  Off
                </button>
                <button
                  onClick={() => onSubtitleDisplayChange("source")}
                  style={{
                    background: subtitleDisplay === "source" ? t.surface : "none",
                    border: `1px solid ${t.border}`,
                    color: subtitleDisplay === "source" ? t.secondaryText : t.muted,
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    cursor: "pointer",
                  }}
                >
                  SRC
                </button>
                <button
                  onClick={() => onSubtitleDisplayChange("target")}
                  style={{
                    background: subtitleDisplay === "target" ? t.surface : "none",
                    border: `1px solid ${t.border}`,
                    color: subtitleDisplay === "target" ? t.secondaryText : t.muted,
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    cursor: "pointer",
                  }}
                >
                  TR
                </button>
              </div>
            </div>
          )}
        </div>

        {videoUrl && (
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${t.border}`, color: t.muted,
            padding: "2px 5px", borderRadius: 3,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, cursor: "pointer",
          }}>✕</button>
        )}
      </div>

      {/* Content */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          style={{ width: "100%", display: "block", flex: 1, minHeight: 0 }}
        >
          {trackUrl && (
            <track
              key={trackUrl}              // important: forces reload when URL changes
              kind="subtitles"
              src={trackUrl}
              srcLang={subtitleLang}
              label={subtitleLabel}
              default
            />
          )}
        </video>
      ) : (
        <div
          onClick={handleClick}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8, color: t.muted, fontSize: 11, cursor: "pointer",
            transition: "color 0.15s", minHeight: 80,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = t.secondaryText; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = t.muted; }}
        >
          <span style={{ fontSize: 24 }}>▶</span>
          <span>Load a video file</span>
          <span style={{ fontSize: 10, color: t.muted }}>mp4 · mkv · mov · avi</span>
        </div>
      )}
    </div>
  );
}
