use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{command, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub grid_size: u32,
    pub taskbar_overlap: bool,
    pub search_engine: String,
    #[serde(default)]
    pub wallpapers: HashMap<usize, String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            grid_size: 128,
            taskbar_overlap: false,
            search_engine: "https://google.com/search?q=".into(),
            wallpapers: HashMap::new(),
        }
    }
}

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.json"))
}

fn write_settings_atomic(app: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = config_path(app)?;
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, &json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let path = config_path(&app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let json = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&json).unwrap_or_default())
}

#[command]
pub fn set_setting(app: tauri::AppHandle, key: String, value: serde_json::Value) -> Result<(), String> {
    let path = config_path(&app)?;
    let mut settings: AppSettings = if path.exists() {
        let json = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&json).unwrap_or_default()
    } else {
        AppSettings::default()
    };

    match key.as_str() {
        "gridSize" => {
            settings.grid_size = value
                .as_u64()
                .ok_or("gridSize must be a number")?
                .try_into()
                .map_err(|_| "gridSize out of range")?;
        }
        "taskbarOverlap" => {
            settings.taskbar_overlap = value
                .as_bool()
                .ok_or("taskbarOverlap must be a boolean")?;
        }
        "searchEngine" => {
            settings.search_engine = value
                .as_str()
                .ok_or("searchEngine must be a string")?
                .to_string();
        }
        "wallpaper" => {
            let obj = value.as_object().ok_or("wallpaper must be an object")?;
            let monitor = obj
                .get("monitor")
                .and_then(|v| v.as_u64())
                .ok_or("wallpaper.monitor must be a number")?
                .try_into()
                .map_err(|_| "wallpaper.monitor out of range")?;
            let path = obj
                .get("path")
                .and_then(|v| v.as_str())
                .ok_or("wallpaper.path must be a string")?
                .to_string();
            settings.wallpapers.insert(monitor, path);
        }
        _ => return Err(format!("Unknown setting key: {key}")),
    }

    write_settings_atomic(&app, &settings)
}
