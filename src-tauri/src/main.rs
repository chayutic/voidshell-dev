#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod system;
mod shortcuts;
mod ai;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            system::get_monitors,
            system::set_wallpaper,
            system::toggle_monitor_power,
            system::system_standby,
            system::shutdown_system,
            system::restart_system,
            shortcuts::launch_application,
            shortcuts::execute_ninja_action,
            shortcuts::save_layout,
            shortcuts::load_layout,
            ai::paste_into_active_window,
        ])