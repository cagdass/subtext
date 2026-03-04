import { useTheme } from "../hooks/useTheme";
import type { AppSettings, TranslationEngine } from "../types";

interface Props {
  isDark: boolean;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
}

const ENGINE_LABELS: { id: TranslationEngine; label: string }[] = [
  { id: "claude",  label: "Claude"  },
  { id: "deepl",   label: "DeepL"   },
  { id: "openai",  label: "OpenAI"  },
  { id: "google",  label: "Google"  },
];

export function SettingsScreen({ isDark, settings, onUpdate, onClose }: Props) {
  const t = useTheme(isDark);

  const setKey = (engine: TranslationEngine, value: string) => {
    onUpdate({ apiKeys: { ...settings.apiKeys, [engine]: value } });
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, background: t.bg, border: `1px solid ${t.border}`,
    color: t.text, padding: "7px 10px", borderRadius: 4,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, outline: "none",
  };

  return (
    <div style={{
      maxWidth: 520, margin: "0 auto", padding: "28px 20px",
      display: "flex", flexDirection: "column", gap: 26,
      overflowY: "auto", flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>
          Settings
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: t.muted, fontSize: 18, padding: "2px 6px",
        }}>✕</button>
      </div>

      {/* API Keys */}
      <section style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: t.muted }}>
          API Keys
        </div>
        {ENGINE_LABELS.map(({ id, label }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, minWidth: 72, color: t.secondaryText }}>{label}</span>
            <input
              type="password"
              placeholder={`${label} API key...`}
              value={settings.apiKeys[id] ?? ""}
              onChange={e => setKey(id, e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
            />
          </div>
        ))}
      </section>

      <div style={{ height: 1, background: t.border }} />

      {/* Appearance */}
      <section style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: t.muted }}>
          Appearance
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, flex: 1 }}>Theme</span>
          <select
            value={settings.theme}
            onChange={e => onUpdate({ theme: e.target.value as AppSettings["theme"] })}
            style={{
              background: t.bg, border: `1px solid ${t.border}`, color: t.text,
              padding: "5px 10px", borderRadius: 4,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: "none",
            }}
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </section>

      <div style={{ height: 1, background: t.border }} />

      {/* About */}
      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: t.muted }}>
          About
        </div>
        <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.8 }}>
          SubText v0.1.0 · MIT License<br />
          Open-source subtitle translator<br />
          <span style={{ color: t.accent }}>github.com/you/subtext</span>
        </div>
      </section>
    </div>
  );
}
