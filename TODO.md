# VoidShell — Build Agenda

## Phase 2 — Grid & Layout Persistence

- [x] Seed a default `layout.json` with a few example shortcuts for first-run

---

## Phase 3 — Ninja Context Menus

- [ ] `NinjaMenu` positioning: render at cursor coordinates, not relative to icon
- [ ] Close `NinjaMenu` on click-outside / Escape (currently uses `onMouseLeave`)
- [ ] Example: Browser shortcut with "Open Incognito", "Open Work Profile" actions

---

## Phase 4 — Input Bar & Slash Command Routing

- [ ] Global hotkey to toggle input bar (e.g. `Win + Space`) via Tauri global shortcut plugin
- [ ] Input routing logic: detect slash commands (`/sys`, `/web`, `/ai`), URLs, shortcut names
- [ ] `/sys` command: route to system command executor (e.g., "/sys sleep", "/sys shutdown")
- [ ] `/web` command: explicit web search via default search engine
- [ ] Default behavior: no slash command detected → web search via configurable search engine (currently `console.log`)
- [ ] Stub `/ai` command for future Ollama integration
- [ ] Display results inline below the input bar (search results or command feedback)

---

## Phase 5 — Settings Panel & Typography System

- [ ] Create Settings panel UI (`SettingsPanel.tsx`)
- [ ] Implement typography preset editor with live preview (H1-H5, Body1-Body3)
- [ ] Allow editing: font-family, size, weight, line-height, letter-spacing for each preset
- [ ] User-defined variables: "Add Custom Variable" feature to create new typography vars
- [ ] Settings options: grid size (96px, 128px, 160px, custom), taskbar overlap toggle, default search engine
- [ ] Generate CSS custom properties from `theme.json` and export to `variables.css`
- [ ] Reset to defaults button
- [ ] Store settings in `config.json` and `theme.json` in AppData

---

## Phase 6 — Widget System

- [ ] `get_telemetry` Rust command using `sysinfo`: CPU %, RAM used/total, (optional) GPU — register in `main.rs`
- [ ] `SystemTelemetry` widget: wire to `get_telemetry`, poll every 2s, render in `WidgetLayer`
- [ ] Generic `ApiWidget` component: configurable URL, refresh interval, JSON path for display
- [ ] Widget drag-to-position within `WidgetLayer` (persisted separately from `layout.json`)
- [ ] Example widgets: Weather (wttr.in), Clock

---

## Phase 7 — Polish & Distribution

- [ ] App icon and bundle metadata in `tauri.conf.json`
- [ ] Start on Windows login (registry `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`)
- [ ] Export/import layout as JSON
- [ ] Build and sign NSIS installer via `cargo tauri build`
