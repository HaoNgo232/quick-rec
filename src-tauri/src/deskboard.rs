use anyhow::Result;
use arboard::Clipboard;
use std::process::Command;

pub struct Deskboard;

impl Deskboard {
    pub fn copy_path(path: &str) -> Result<()> {
        let mut clipboard = Clipboard::new()?;
        clipboard.set_text(path.to_string())?;
        Ok(())
    }

    pub fn play_sound_start() {
        let _ = Command::new("paplay")
            .arg("/usr/share/sounds/freedesktop/stereo/screen-capture.oga")
            .spawn();
    }

    pub fn play_sound_stop() {
        let _ = Command::new("paplay")
            .arg("/usr/share/sounds/freedesktop/stereo/complete.oga")
            .spawn();
    }
}

#[cfg(test)]
mod tests {
    

    #[test]
    fn test_deskboard_clipboard_smoke() {
        // Test clipboard initialization does not panic
        let clip_res = arboard::Clipboard::new();
        assert!(clip_res.is_ok() || std::env::var("CI").is_ok());
    }
}
