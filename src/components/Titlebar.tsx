import type { Screen } from "../App";
import { useTheme } from "../hooks/useTheme";

interface Props {
  isDark: boolean;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onToggleTheme: () => void;
}

function SubTextIcon({ size = 28, accent }: { size?: number; accent: string; isDark: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <text
        x="256" y="368"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="270"
        fontWeight="700"
        fill={accent}
      >S</text>

      {/* Left horn */}
      <path d="M 192 193 C 175 163, 155 138, 165 105" stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M 165 105 C 172 91, 185 93, 188 105" stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" />

      {/* Right horn */}
      <path d="M 320 193 C 337 163, 357 138, 347 105" stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M 347 105 C 340 91, 327 93, 324 105" stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" />

      {/* Tail */}
      <path d="M 256 376 C 256 406, 256 423, 290 438 C 324 453, 348 443, 344 420 C 340 398, 318 393, 302 406" stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" />
      <polygon points="302,406 286,418 308,422" fill={accent} />
    </svg>
  );
}

export function Titlebar({ isDark, screen, onNavigate, onToggleTheme }: Props) {
  const t = useTheme(isDark);

  const btn = (label: string, target: Screen) => (
    <button
      onClick={() => onNavigate(screen === target ? "editor" : target)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: screen === target ? t.accent : t.muted,
        padding: "5px 8px",
        borderRadius: 4,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        transition: "color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => { if (screen !== target) (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = screen === target ? t.accent : t.muted; }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 14px",
      height: 44,
      borderBottom: `1px solid ${t.border}`,
      background: t.surface,
      flexShrink: 0,
    }}>
      <SubTextIcon size={28} accent={t.accent} isDark={isDark} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {btn("⊕ import", "import")}
        {btn("⚙", "settings")}
        <button
          onClick={onToggleTheme}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: t.muted, padding: "5px 8px", borderRadius: 4,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          }}
        >
          {isDark ? "☀" : "☾"}
        </button>
      </div>
    </div>
  );
}
