import type { Screen } from "../App";
import { useTheme } from "../hooks/useTheme";

interface Props {
  isDark: boolean;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onToggleTheme: () => void;
}

function SubTextIcon({ size = 28, accent, isDark }: { size?: number; accent: string; isDark: boolean }) {
  const fg = isDark ? "#0e0e0f" : "#fff";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Spreader bar */}
      <rect x="3" y="5" width="26" height="3" rx="1.5" fill={accent} />
      {/* O-ring cuffs */}
      <circle cx="5"  cy="6.5" r="2" stroke={accent} strokeWidth="1.2" fill="none" />
      <circle cx="27" cy="6.5" r="2" stroke={accent} strokeWidth="1.2" fill="none" />
      {/* SUB text */}
      <text x="16" y="22" textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace" fontWeight="700"
        fontSize="11" fill={accent} letterSpacing="-0.5">
        SUB
      </text>
      {/* Collar O-ring dangling off the B */}
      <circle cx="24.5" cy="27" r="2.5" stroke={accent} strokeWidth="1.4" fill="none" opacity="0.75" />
      <line x1="24.5" y1="23" x2="24.5" y2="24.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
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
