use tauri::{command, App, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: usize,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub name: String,
}

/// Called during app setup — spawns a transparent borderless window per monitor.
pub fn setup_monitor_windows(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let monitors = app.available_monitors()?;

    for (idx, monitor) in monitors.iter().enumerate() {
        let pos = monitor.position();
        let size = monitor.size();

        let label = format!("monitor-{}", idx);
        let _window = tauri::WebviewWindowBuilder::new(
            app,
            &label,
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title(format!("VoidShell {}", idx))
        .transparent(true)
        .decorations(false)
        .resizable(false)
        .inner_size(size.width as f64, size.height as f64)
        .position(pos.x as f64, pos.y as f64)
        .skip_taskbar(true)
        .build()?;

        // Set window to bottom Z-order (above WorkerW wallpaper layer)
        #[cfg(windows)]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE};
            let hwnd = HWND(_window.hwnd()?.0);
            unsafe {
                let _ = SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            }
        }
    }

    Ok(())
}

#[command]
pub fn get_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let result = monitors
        .iter()
        .enumerate()
        .map(|(idx, m)| MonitorInfo {
            id: idx,
            width: m.size().width,
            height: m.size().height,
            x: m.position().x,
            y: m.position().y,
            name: m.name().cloned().unwrap_or_default(),
        })
        .collect();
    Ok(result)
}

#[command]
pub fn set_wallpaper(_monitor_id: usize, _image_path: String) -> Result<(), String> {
    // Stub — per-monitor wallpaper requires writing to a per-monitor registry key
    // or using the IDesktopWallpaper COM interface (Phase 1 follow-up).
    Err("Per-monitor wallpaper not yet implemented".to_string())
}

#[command]
pub fn toggle_monitor_power(on: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Win32::UI::WindowsAndMessaging::{SendMessageW, HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER};
        // lParam: -1 = on, 2 = off
        let param: isize = if on { -1 } else { 2 };
        unsafe {
            SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER as usize, param);
        }
        Ok(())
    }
    #[cfg(not(windows))]
    Err("Only supported on Windows".to_string())
}

#[command]
pub fn system_standby() -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Win32::System::Power::SetSuspendState;
        let ok = unsafe { SetSuspendState(false, true, false) };
        if ok.as_bool() { Ok(()) } else { Err("SetSuspendState failed".to_string()) }
    }
    #[cfg(not(windows))]
    Err("Only supported on Windows".to_string())
}

#[command]
pub fn shutdown_system() -> Result<(), String> {
    std::process::Command::new("shutdown")
        .args(["/s", "/t", "0"])
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[command]
pub fn restart_system() -> Result<(), String> {
    std::process::Command::new("shutdown")
        .args(["/r", "/t", "0"])
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}
