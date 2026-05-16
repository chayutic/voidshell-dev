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

fn monitor_bounds(monitor: &tauri::Monitor, taskbar_overlap: bool) -> (f64, f64, f64, f64) {
    #[cfg(windows)]
    if !taskbar_overlap {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::Graphics::Gdi::{
            GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST,
        };
        let pos = monitor.position();
        let pt = POINT { x: pos.x, y: pos.y };
        let hmonitor = unsafe { MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST) };
        let mut mi: MONITORINFO = unsafe { std::mem::zeroed() };
        mi.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        unsafe { GetMonitorInfoW(hmonitor, &mut mi) };
        let rc = mi.rcWork;
        return (
            (rc.right - rc.left) as f64,
            (rc.bottom - rc.top) as f64,
            rc.left as f64,
            rc.top as f64,
        );
    }
    let s = monitor.size();
    let p = monitor.position();
    (s.width as f64, s.height as f64, p.x as f64, p.y as f64)
}

/// Called during app setup — spawns a transparent borderless window per monitor.
pub fn setup_monitor_windows(app: &mut App, settings: &crate::config::AppSettings) -> Result<(), Box<dyn std::error::Error>> {
    let monitors = app.available_monitors()?;

    for (idx, monitor) in monitors.iter().enumerate() {
        let (w, h, x, y) = monitor_bounds(monitor, settings.taskbar_overlap);

        let label = format!("monitor-{}", idx);
        let window = tauri::WebviewWindowBuilder::new(
            app,
            &label,
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title(format!("VoidShell {}", idx))
        .transparent(true)
        .decorations(false)
        .resizable(false)
        .inner_size(w, h)
        .position(x, y)
        .skip_taskbar(true)
        .build()?;

        // Place above WorkerW (wallpaper layer), below all regular windows.
        // HWND_BOTTOM = HWND(1): sits at the bottom of the Z-order stack,
        // which in practice lands above the WorkerW layer.
        #[cfg(windows)]
        {
            use windows::Win32::UI::WindowsAndMessaging::{
                SetWindowPos, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE,
            };
            unsafe {
                let _ = SetWindowPos(window.hwnd()?, Some(HWND_BOTTOM), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            }
        }

        #[cfg(not(windows))]
        let _ = window;
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
pub fn apply_window_bounds(app: tauri::AppHandle, taskbar_overlap: bool) -> Result<(), String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    for (idx, monitor) in monitors.iter().enumerate() {
        let label = format!("monitor-{}", idx);
        if let Some(window) = app.get_webview_window(&label) {
            let (w, h, x, y) = monitor_bounds(monitor, taskbar_overlap);
            window.set_size(tauri::PhysicalSize::new(w as u32, h as u32)).map_err(|e| e.to_string())?;
            window.set_position(tauri::PhysicalPosition::new(x as i32, y as i32)).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[command]
pub fn set_wallpaper(monitor_id: usize, image_path: String) -> Result<(), String> {
    set_wallpaper_inner(monitor_id, &image_path)
}

#[cfg(windows)]
pub fn set_wallpaper_inner(monitor_id: usize, image_path: &str) -> Result<(), String> {
    use std::path::Path;

    // Validate absolute path
    if !Path::new(image_path).is_absolute() {
        return Err("Image path must be absolute".to_string());
    }

    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_LOCAL_SERVER, COINIT_APARTMENTTHREADED,
    };
    use windows::Win32::UI::Shell::{DesktopWallpaper, IDesktopWallpaper};

    unsafe {
        let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        if hr.is_err() {
            return Err(format!("CoInitializeEx failed: {:?}", hr));
        }

        let wallpaper: IDesktopWallpaper = match CoCreateInstance(&DesktopWallpaper, None, CLSCTX_LOCAL_SERVER) {
            Ok(w) => w,
            Err(e) => {
                CoUninitialize();
                return Err(format!("Failed to create IDesktopWallpaper: {}", e));
            }
        };

        // Get the monitor device path string
        let count = match wallpaper.GetMonitorDevicePathCount() {
            Ok(c) => c,
            Err(e) => {
                CoUninitialize();
                return Err(format!("GetMonitorDevicePathCount failed: {}", e));
            }
        };

        if monitor_id >= count as usize {
            CoUninitialize();
            return Err(format!(
                "Monitor index {} out of range (count: {})",
                monitor_id, count
            ));
        }

        let monitor_str = match wallpaper.GetMonitorDevicePathAt(monitor_id as u32) {
            Ok(s) => s,
            Err(e) => {
                CoUninitialize();
                return Err(format!("GetMonitorDevicePathAt failed: {}", e));
            }
        };

        // Convert image_path to wide string and set wallpaper
        let wide: Vec<u16> = image_path
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let wallpaper_pcwstr = windows::core::PCWSTR(wide.as_ptr());

        if let Err(e) = wallpaper.SetWallpaper(monitor_str, wallpaper_pcwstr) {
            CoUninitialize();
            return Err(format!("SetWallpaper failed: {}", e));
        }

        CoUninitialize();
        Ok(())
    }
}

#[cfg(not(windows))]
pub fn set_wallpaper_inner(_monitor_id: usize, _image_path: &str) -> Result<(), String> {
    Err("Wallpaper setting only supported on Windows".to_string())
}

#[command]
pub fn toggle_monitor_power(on: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::{LPARAM, WPARAM};
        use windows::Win32::UI::WindowsAndMessaging::{
            PostMessageW, HWND_BROADCAST, SC_MONITORPOWER, WM_SYSCOMMAND,
        };
        // lParam: -1 = power on, 2 = power off
        let lparam: isize = if on { -1 } else { 2 };
        // Use PostMessageW (fire-and-forget) to avoid blocking the Tauri thread.
        unsafe {
            let _ = PostMessageW(
                Some(HWND_BROADCAST),
                WM_SYSCOMMAND,
                WPARAM(SC_MONITORPOWER as usize),
                LPARAM(lparam),
            );
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
        if ok {
            Ok(())
        } else {
            Err("SetSuspendState failed".to_string())
        }
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
