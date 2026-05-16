#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod system;
mod shortcuts;
mod config;
mod ai;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let settings = config::get_settings(app.handle().clone()).unwrap_or_default();
            system::setup_monitor_windows(app, &settings)?;

            // Re-apply persisted wallpapers
            for (monitor_id, path) in &settings.wallpapers {
                let _ = system::set_wallpaper_inner(*monitor_id, path);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            system::get_monitors,
            system::apply_window_bounds,
            system::set_wallpaper,
            system::toggle_monitor_power,
            system::system_standby,
            system::shutdown_system,
            system::restart_system,
            shortcuts::launch_application,
            shortcuts::execute_ninja_action,
            shortcuts::save_layout,
            shortcuts::load_layout,
            shortcuts::validate_path,
            config::get_settings,
            config::set_setting,
            ai::paste_into_active_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
