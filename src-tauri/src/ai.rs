use tauri::command;

/// Takes a string, puts it on the clipboard, then simulates Alt+Tab + Ctrl+V
/// to paste it into whichever window was previously focused.
#[command]
pub fn paste_into_active_window(text: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use enigo::{Enigo, Key, Keyboard, Settings, Direction};

        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // Write to clipboard via arboard (added as dependency)
        let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
        clipboard.set_text(&text).map_err(|e| e.to_string())?;

        // Switch to the previous window
        enigo.key(Key::Alt, Direction::Press).map_err(|e| e.to_string())?;
        enigo.key(Key::Tab, Direction::Click).map_err(|e| e.to_string())?;
        enigo.key(Key::Alt, Direction::Release).map_err(|e| e.to_string())?;

        // Small delay to let the OS finish the window switch
        std::thread::sleep(std::time::Duration::from_millis(200));

        // Paste
        enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
        enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| e.to_string())?;
        enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = text;
        Err("Only supported on Windows".to_string())
    }
}
