# Project Specification: VoidShell Desktop Engine (v2)

VoidShell is a high-performance, low-overhead desktop environment overlay for Windows. It provides a modular, web-tech-based interface that sits above the system wallpaper while providing "ninja" productivity features, local AI integration, and smartphone-style shortcut management.

---

## 1. Window & Monitor Management
The engine treats each monitor as an independent canvas while maintaining system-level layering.

* **Layering Logic:** - The application window is set to the "Bottom" Z-order.
    - It must sit specifically above the `WorkerW` (wallpaper) layer but allow the Windows Taskbar to remain visible if the user chooses.
* **Per-Monitor Canvas:**
    - Detects all connected monitors via the Tauri `Manager` API.
    - Spawns a unique, transparent, borderless window for each monitor.
* **Wallpaper Engine:**
    - Per-monitor wallpaper via Windows COM `IDesktopWallpaper` interface (`CoCreateInstance → SetWallpaper`).
    - Paths persisted in `config.json` under `wallpapers: { monitorIndex: path }` and re-applied on startup.
* **Taskbar Toggle:** A configuration setting (`taskbarOverlap: bool`) to either respect the "Work Area" (leaving space for the taskbar) or fill the "Monitor Area" (overlapping the taskbar). On Windows, uses `GetMonitorInfoW` `rcWork` to compute work-area bounds. Live resize is supported — toggling the setting calls `apply_window_bounds` without requiring an app restart.

---

## 2. Shortcut & Grid System
A flexible UI for launching applications and organizing workflows.

* **The Grid:** - Pixel-based grid system (default 128×128px cells, configurable in Settings).
    - Scales naturally across monitor sizes; users can adjust grid size (96px, 128px, 160px, etc.) for granularity.
    - **Snapping:** Shortcuts automatically snap to the nearest grid cell.
    - **Persistence:** Positions, icons, and paths are saved to a local `layout.json`.
* **Shortcut Types:**
    - **Standard:** Executable path/URL + Custom Icon + Text Label.
    - **Folders:** A shortcut that, when clicked, opens a pop-out overlay or "Portal" containing its own sub-grid.
* **"Ninja Actions" (Context Menus):**
    - Right-click functionality for shortcuts to execute alternate logic.
    - *Example:* Right-clicking a "Browser" shortcut offers "Open Work Profile," "Open Incognito," or "Open specific URL."

---

## 3. System Operations (Power Module)
Exposes native Windows power management to the frontend via Rust `tauri::command` wrappers.

| Action | Technical Implementation (Rust) |
| :--- | :--- |
| **Monitor Power** | Use `winapi` to send `WM_SYSCOMMAND` / `SC_MONITORPOWER`. |
| **System Standby** | Call `SetSuspendState` via `PowrProf.dll`. |
| **Shutdown/Restart** | Execute `std::process::Command` with `shutdown /s /t 0`. |
| **App Execution** | Use `Command::new(path).spawn()` to ensure detached lifecycle. |

---

## 4. Input Bar & Command Routing
A central command palette for system actions and web search.

* **Slash Command Routing:**
    - `/ai` — Reserved for future local AI integration (Ollama) when available.
    - `/web` — Explicit web search via default search engine.
    - `/sys` — System commands (e.g., "/sys sleep", "/sys shutdown").
    - **Default:** If no slash command is detected, input is treated as a Google search.
* **Logic Branching:**
    - **URL:** Detects valid URLs and opens them in the default browser.
    - **Command:** Detects shortcut names or system commands (e.g., "sleep", "off").
    - **Search:** Falls back to default search engine (configurable in Settings).
* **AI Integration (Scaffolded):** `useOllama` hook streams responses from a local Ollama instance (`localhost:11434`). In the Search bar, the `?` prefix routes to it. Clipboard injection into the active window is implemented via `paste_into_active_window` (uses `enigo` + `arboard`). Full `/ai` slash command and model selection are future refinements.

---

## 5. Extensible Widget API
A container system for custom, API-driven widgets.

* **Data Fetching:** A generic Rust or React-based fetcher that pulls from external REST APIs (Weather, Stocks, Crypto, etc.).
* **System Telemetry:** Real-time stream of CPU load, RAM usage, and GPU metrics provided by the Rust `sysinfo` crate.
* **UI Freedom:** No hardcoded typography or themes; all widgets are styled via a centralized typography system with preset variables and user customization.

---

## 6. Settings & Theming System
Centralized app configuration and visual customization.

* **Typography Presets:** Predefined typography variables for consistent styling across the app.
    - **Headings:** H1, H2, H3, H4, H5 (for section titles, widget headers, folder names).
    - **Body:** Body1, Body2, Body3 (for content, labels, descriptions).
    - **Optional:** Caption (for tiny labels), Small (for secondary text).
    - Each preset is configurable: font family, size, weight, line height, letter spacing.
* **User-Defined Variables:** Users can create custom typography variables (e.g., `--my-small-bold`) and apply them throughout the UI.
* **Settings Panel Options:**
    - Grid size (96px, 128px, 160px, or custom).
    - Taskbar overlap behavior (respect work area vs. full screen).
    - Default search engine.
    - Default AI model (when Ollama integration is enabled in the future).
    - Typography preset editor with live preview.
    - Custom variable creation and management.
    - Theme reset to defaults.
* **Persistence:** All settings stored in `config.json` in the AppData directory; theme variables stored in `theme.json`.

---

## 7. Implementation Prompts for AI Coding (Roadmap)

### Phase 1: The Multi-Window Foundation
> \"Write a Tauri v2 setup in Rust that detects all connected monitors. Create a transparent, borderless window for each monitor that ignores the taskbar (fullscreen) and sits at the bottom of the window stack (above wallpaper). Use the `tauri-plugin-shell` for process management.\"

### Phase 2: Grid Persistence Logic
> \"Create a React component that renders a pixel-based snapping grid (default 128×128px cells). The grid size should be configurable via a Settings value. Implement drag-and-drop so icons snap to cells. Write logic to save and load icon positions and metadata (name, path, icon_url) to a local layout.json in the AppData directory.\"

### Phase 3: The Ninja Context Menu
> \"Implement a custom right-click context menu in React for the shortcuts. The menu should be dynamically generated based on an 'alternate_actions' array in the shortcut's JSON object. When an action is clicked, it should call a Rust command to execute a shell command.\"

### Phase 4: Slash Commands & Search Routing
> \"Build a global input bar with slash command detection. Route /sys commands to a system command executor, /web to a search engine (configurable), and default input to web search. Stub out /ai for future Ollama integration. Wire up a global hotkey (Win+Space) to show/hide the input bar using Tauri's global shortcut plugin.\"

### Phase 5: Settings Panel & Typography System
> \"Create a Settings panel with configurable options: grid size, taskbar overlap, default search engine, and a typography editor. Implement a preset typography system (H1-H5, Body1-Body3) with editable properties (font-family, size, weight, line-height, letter-spacing). Allow users to create custom typography variables. Store settings in config.json and theme variables in theme.json. Export CSS custom properties that React components can consume.\"

---

## 8. Recommended File Structure
```text
/src-tauri
  /src
    - main.rs        # Tauri Entry point & Window Setup
    - system.rs      # Power management & Monitor logic
    - shortcuts.rs   # App launching & Ninja actions
/src
  /components
    /Grid            # Grid, Snapping, and D&D logic
    /Shortcuts       # Icon, Folder, and Context Menu components
    /Widgets         # User-defined API/System widgets
    /InputBar        # Command input & slash command routing
    /Settings        # Settings panel & typography editor
  /hooks
    - useSystem.ts   # Bridge to Rust commands
    - useSettings.ts # Settings & theme management
  /theme
    - variables.css  # CSS custom properties (generated from config)
    - defaults.json  # Default typography presets
  /config
    - config.json    # User settings (persisted)
    - theme.json     # User typography variables (persisted)