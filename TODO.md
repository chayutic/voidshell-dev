# VoidShell — Build Agenda

## Phase 1 — Multi-Window Foundation
Get a transparent, borderless window sitting above the wallpaper on every connected monitor.

- [ ] Verify `tauri.conf.json` window config — no default window, all windows spawned in `setup`
- [ ] Implement `setup_monitor_windows` fully: test on single monitor, then dual
- [ ] Confirm Z-order: window sits above `WorkerW` (wallpaper) but below taskbar
- [ ] Add taskbar-overlap toggle: respect work area vs fill full monitor area (config flag)
- [ ] Per-monitor wallpaper: implement `set_wallpaper` via `IDesktopWallpaper` COM interface
- [ ] Wire `get_monitors` command and verify it returns real monitor data in the frontend

---

## Phase 2 — Grid & Layout Persistence
A snapping icon grid whose state survives restarts.

- [ ] Render CSS grid in `Grid.tsx` with configurable cols/rows (default is a 128x128px grid)
- [ ] Implement drag-and-drop for `ShortcutIcon` — snap to nearest grid cell on drop
- [ ] Call `save_layout` on every drop so positions persist immediately
- [ ] Add/remove shortcuts from the grid (right-click → "Remove", empty cell click → "Add")
- [ ] Seed a default `layout.json` with a few example shortcuts for first-run
- [ ] `FolderPortal` — open sub-grid overlay when a Folder shortcut is clicked

---

## Phase 3 — Ninja Context Menus
Right-click actions that execute alternate logic per shortcut.

- [ ] `NinjaMenu` positioning: render at cursor coordinates, not relative to icon
- [ ] Close menu on click-outside / Escape
- [ ] `execute_ninja_action` Rust command: handle `Exec`, `Url`, and `System` variants
- [ ] UI for editing alternate actions (add/remove/reorder within a shortcut)
- [ ] Example: Browser shortcut with "Open Incognito", "Open Work Profile" actions

---

## Phase 4 — Input Bar & AI Integration
The command palette and Ollama bridge.

- [ ] Global hotkey to toggle Search bar (e.g. `Win + Space`) via Tauri global shortcut plugin
- [ ] Input routing: URL → `plugin:shell|open`, system command → invoke, `?` prefix → Ollama
- [ ] `useOllama` hook: test streaming with a running local Ollama instance
- [ ] Display streaming AI response inline below the input bar
- [ ] `paste_into_active_window` command: test Alt+Tab + Ctrl+V injection via `enigo`
- [ ] "Paste to active window" button shown after an AI response

---

## Phase 5 — Widget System
Pluggable, API-driven info tiles.

- [ ] `get_telemetry` Rust command using `sysinfo`: CPU %, RAM used/total, (optional) GPU
- [ ] `SystemTelemetry` widget: poll every 2s, render in `WidgetLayer`
- [ ] Generic `ApiWidget` component: configurable URL, refresh interval, JSON path for display
- [ ] Widget drag-to-position within `WidgetLayer` (persisted separately from `layout.json`)
- [ ] Example widgets: Weather (wttr.in), Clock

---

## Phase 6 — Polish & Distribution
Ship-ready quality.

- [ ] App icon and bundle metadata in `tauri.conf.json`
- [ ] Start on Windows login (registry `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`)
- [ ] Settings panel: grid size, taskbar overlap, default AI model, theme variables
- [ ] Export/import layout as JSON
- [ ] Build and sign NSIS installer via `cargo tauri build`
