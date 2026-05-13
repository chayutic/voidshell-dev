use tauri::command;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Shortcut {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_url: Option<String>,
    pub grid_x: u32,
    pub grid_y: u32,
    pub shortcut_type: ShortcutType,
    pub alternate_actions: Vec<AlternateAction>,
    /// For Folder type — shortcuts nested inside this folder
    pub children: Option<Vec<Shortcut>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShortcutType {
    Standard,
    Folder,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlternateAction {
    pub label: String,
    pub command: String,
    pub action_type: AlternateActionType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AlternateActionType {
    Exec,
    Url,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Layout {
    pub version: u32,
    pub grid_cols: u32,
    pub grid_rows: u32,
    pub shortcuts: Vec<Shortcut>,
}

fn layout_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("layout.json"))
}

#[command]
pub fn launch_application(path: String) -> Result<(), String> {
    std::process::Command::new(&path)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to launch '{}': {}", path, e))
}

#[command]
pub fn execute_ninja_action(command: String, action_type: AlternateActionType) -> Result<(), String> {
    match action_type {
        AlternateActionType::Exec => {
            std::process::Command::new("cmd")
                .args(["/C", &command])
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
        AlternateActionType::Url => {
            open::that(&command).map_err(|e| e.to_string())
        }
        AlternateActionType::System => {
            Err("System actions are dispatched directly from the frontend".to_string())
        }
    }
}

#[command]
pub fn save_layout(app: tauri::AppHandle, layout: Layout) -> Result<(), String> {
    let path = layout_path(&app)?;
    let json = serde_json::to_string_pretty(&layout).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())
}

#[command]
pub fn load_layout(app: tauri::AppHandle) -> Result<Layout, String> {
    let path = layout_path(&app)?;
    if !path.exists() {
        return Ok(Layout {
            version: 1,
            grid_cols: 12,
            grid_rows: 8,
            shortcuts: vec![],
        });
    }
    let json = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}
