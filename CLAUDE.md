# VoidShell — Project Guide

## What This Is
Tauri v2 + React desktop overlay for Windows. Renders a transparent, borderless window per monitor, sitting above the wallpaper layer (WorkerW) and below the taskbar. Shortcut grid, search/command bar, and widget layer live in the web layer.

## Architecture

### Rust backend (`src-tauri/src/`)
| File | Responsibility |
|------|---------------|
| `main.rs` | App entry, Tauri setup hook, command registration |
| `system.rs` | Monitor window spawning, wallpaper COM, power commands |
| `shortcuts.rs` | Layout save/load (atomic), app launch, ninja action dispatch |
| `config.rs` | `AppSettings` struct, `get_settings`/`set_setting`, atomic writes to `config.json` |
| `ai.rs` | `paste_into_active_window` — clipboard + enigo Alt+Tab+Ctrl+V |

### React frontend (`src/`)
| Path | Responsibility |
|------|---------------|
| `App.tsx` | Root: `<WidgetLayer /> <Grid /> <Search />` |
| `components/Grid/Grid.tsx` | Pixel-based snapping grid, drag-drop, context menu for add/remove |
| `components/Shortcuts/ShortcutIcon.tsx` | Draggable icon, ContextMenu, NinjaMenu, FolderPortal trigger |
| `components/Shortcuts/FolderPortal.tsx` | Sub-grid overlay for Folder shortcuts (recursive) |
| `components/Shortcuts/ShortcutForm.tsx` | Add/edit modal with path validation, icon picker, ninja actions |
| `components/Shortcuts/ContextMenu.tsx` | Positioned right-click menu, click-outside + Escape to close |
| `components/Shortcuts/NinjaMenu.tsx` | Alternate action list (closes on `onMouseLeave` — fix pending) |
| `components/Search/Search.tsx` | Input bar: URL / `?`=AI / system keywords / fallback search |
| `components/Widgets/WidgetLayer.tsx` | Wallpaper button (bottom-right) + `MonitorPicker` toggle |
| `components/Widgets/MonitorPicker.tsx` | Fixed-position modal: lists monitors with name/resolution, per-monitor wallpaper picker |
| `components/Widgets/SystemTelemetry.tsx` | Polls `get_telemetry` — Rust command not yet registered |
| `hooks/useSettings.ts` | `invoke("get_settings")` + `invoke("set_setting")` + `setWallpaper`; `wallpapers: Record<number,string>` field; invokes `apply_window_bounds` on taskbar toggle |
| `hooks/useSystem.ts` | Typed wrappers for all system Rust commands |
| `hooks/useOllama.ts` | Streaming fetch to `localhost:11434/api/generate` |
| `hooks/useFileDialog.ts` | `@tauri-apps/plugin-dialog` file/image picker |

## Phase Status

| Phase | Status | Remaining |
|-------|--------|-----------|
| 1 — Multi-Window Foundation | ✅ Done | — |
| 2 — Grid & Layout Persistence | ✅ Done | First-run seed layout (`layout.json`) missing |
| 3 — Ninja Context Menus | 🔄 Partial | `execute_ninja_action` done, `ShortcutForm` done; `NinjaMenu` close behavior and positioning need fix |
| 4 — Input Bar & Slash Commands | 🔄 Partial | URL/AI/sys routing works; web search fallback (`console.log`) and global hotkey missing |
| 5 — Settings Panel & Typography | ❌ Not started | `useSettings` hook exists; no `SettingsPanel.tsx` UI |
| 6 — Widget System | ❌ Skeleton | `SystemTelemetry.tsx` exists but `get_telemetry` Rust command not registered; `WidgetLayer` renders empty div |
| 7 — Polish & Distribution | ❌ Not started | |

## Key Persistence
- **`config.json`** (AppData) — `gridSize`, `taskbarOverlap`, `searchEngine`, `wallpapers: {[monitorIdx]: path}`
- **`layout.json`** (AppData) — shortcut grid positions, paths, icons, folder children (recursive)

## Dependency Notes
- `windows` crate pinned at `0.61` — matches Tauri's `windows-core` version; do not upgrade independently
- No `react-dnd` — drag-and-drop uses native HTML5 drag events
- Ollama integration: `useOllama` hook, `?` prefix in Search bar triggers it; `paste_into_active_window` handles injection

## Build
```bash
npm run tauri dev    # dev server + hot reload
npm run tauri build  # production NSIS bundle
```
