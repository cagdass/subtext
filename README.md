# SubText

> *What your subtitles are really saying.*

A lightweight, open-source subtitle translator built with [Tauri](https://tauri.app) + React + TypeScript. Fast, cross-platform, and barebone by design.

---

## Features

- **Load subtitles** via file picker, drag & drop, or paste — `.srt`, `.vtt`, `.ass`, `.sub`
- **Load video** alongside subtitles to review and seek while you translate
- **Multiple translation engines** — Claude, DeepL, OpenAI, Google, or translate manually
- **Side-by-side editor** — original on the left, translation on the right, every line editable
- **Per-line re-translate** — fix a single line without re-running the whole file
- **Edit timings** inline — click any timestamp to adjust it
- **Flexible layout** — place the video panel left, right, top, bottom, or hide it; drag to resize
- **Export** translated `.srt`
- Dark / Light / System theme

---

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org) | ≥ 20 |
| [Rust](https://rustup.rs) | latest stable |
| [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/) | per-platform |

> **macOS:** Xcode Command Line Tools required (`xcode-select --install`)  
> **Windows:** Microsoft C++ Build Tools + WebView2  
> **Linux:** `libwebkit2gtk`, `libssl-dev`, and a few others (see Tauri docs)

---

## Getting started

```bash
# 1. Clone
git clone https://github.com/you/subtext.git
cd subtext

# 2. Install JS dependencies
npm install

# 3. Run in dev mode (hot-reload)
npm run tauri dev

# 4. Build a release binary
npm run tauri build
```

The release binary ends up in `src-tauri/target/release/bundle/`.

---

## API Keys

SubText never hard-codes or phones home with your keys. Open **Settings (⚙)** and paste your keys there — they're stored locally using the OS keychain via Tauri's secure store.

| Engine | Where to get a key |
|--------|--------------------|
| Claude | [console.anthropic.com](https://console.anthropic.com) |
| DeepL  | [deepl.com/pro-api](https://www.deepl.com/pro-api) |
| OpenAI | [platform.openai.com](https://platform.openai.com) |
| Google | [Google Cloud Translation API](https://cloud.google.com/translate) |

---

## Project structure

```
subtext/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── Editor.tsx      # Main editor shell + layout/resize
│   │   ├── Toolbar.tsx     # Language picker, engine selector, layout switcher
│   │   ├── SubtitlePanel.tsx  # Side-by-side subtitle lines
│   │   ├── VideoPanel.tsx  # Video player panel
│   │   ├── ImportScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── Titlebar.tsx
│   ├── hooks/
│   │   └── useTheme.ts     # Dark/light theme tokens
│   ├── lib/
│   │   ├── parser.ts       # SRT/VTT parsing & serialisation
│   │   ├── translator.ts   # Translation engine abstraction
│   │   └── settings.ts     # Persistent settings
│   ├── types/
│   │   └── index.ts        # Shared TypeScript types
│   └── App.tsx
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs          # Native commands (read/write file)
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
└── package.json
```

---

## Roadmap

- [ ] Native file dialogs via Tauri (replacing `<input type="file">`)
- [ ] Batch translation — queue multiple files
- [ ] Subtitle extraction from video via `ffmpeg` sidecar
- [ ] Google Translate engine
- [ ] Project history
- [ ] `.ass` / `.ssa` full support
- [ ] Keyboard shortcuts

---

## Contributing

PRs welcome. This is intentionally kept small — if you're adding a feature, keep it lean.

1. Fork & clone
2. `npm run tauri dev`
3. Make your change
4. Open a PR with a clear description

---

## License

[MIT](./LICENSE)
