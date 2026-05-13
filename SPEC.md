# Creating a markdown file for the project specification.

content = """# Project Specification: VoidShell Desktop Engine (v2)

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
    - Ability to set and persist a custom image background per monitor through the app itself, bypassing standard Windows wallpaper settings.
* **Taskbar Toggle:** A configuration setting to either respect the "Work Area" (leaving space for the taskbar) or fill the "Monitor Area" (overlapping the taskbar).

---

## 2. Shortcut & Grid System
A flexible UI for launching applications and organizing workflows.

* **The Grid:** - Implements a CSS Grid-based coordinate system (e.g., 12x8 or 24x12).
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

## 4. Input Bar & AI Integration
A central command palette for system actions and LLM communication.

* **Local AI (Ollama):**
    - Direct communication with `localhost:11434` (Ollama's default port on Windows).
    - Support for streaming responses from local models (e.g., Llama3, Mistral).
* **Logic Branching:**
    - **URL:** Detects valid URLs and opens them in the default browser.
    - **Command:** Detects shortcut names or system commands (e.g., "sleep", "off").
    - **AI Prompt:** If the input starts with a specific trigger (e.g., `?` or `/ai`), it routes to Ollama.
* **Automation:** Ability to take the result of an AI prompt and "Paste into Chrome" or other active windows using clipboard injection and keystroke simulation.

---

## 5. Extensible Widget API
A container system for custom, API-driven widgets.

* **Data Fetching:** A generic Rust or React-based fetcher that pulls from external REST APIs (Weather, Stocks, Crypto, etc.).
* **System Telemetry:** Real-time stream of CPU load, RAM usage, and GPU metrics provided by the Rust `sysinfo` crate.
* **UI Freedom:** No hardcoded typography or themes; all widgets are styled purely via the user's CSS/Tailwind configuration.

---

## 6. Implementation Prompts for AI Coding (Roadmap)

### Phase 1: The Multi-Window Foundation
> \"Write a Tauri v2 setup in Rust that detects all connected monitors. Create a transparent, borderless window for each monitor that ignores the taskbar (fullscreen) and sits at the bottom of the window stack (above wallpaper). Use the `tauri-plugin-shell` for process management.\"

### Phase 2: Grid Persistence Logic
> \"Create a React component that renders a 12x8 snapping grid. Implement a drag-and-drop system where icons snap to cells. Write the logic to save and load these icon positions and their metadata (name, path, icon_url) to a local JSON file in the AppData directory.\"

### Phase 3: The Ninja Context Menu
> \"Implement a custom right-click context menu in React for the shortcuts. The menu should be dynamically generated based on an 'alternate_actions' array in the shortcut's JSON object. When an action is clicked, it should call a Rust command to execute a shell command.\"

### Phase 4: Ollama & Keystroke Injection
> \"Write a React hook to stream responses from a local Ollama instance. Also, create a Rust command using the `enigo` crate that takes a string, sets it to the system clipboard, and simulates 'ALT+TAB' followed by 'CTRL+V' to paste it into the previous window.\"

---

## 7. Recommended File Structure
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
    /Search          # Input bar & Ollama integration
  /hooks
    - useOllama.ts   # AI Stream handling
    - useSystem.ts   # Bridge to Rust commands
  /theme
    - index.css      # User-controlled styling