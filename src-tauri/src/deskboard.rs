use anyhow::Result;
use arboard::Clipboard;
use std::process::Command;

pub struct Deskboard;

impl Deskboard {
    pub fn copy_path(path: &str) -> Result<()> {
        #[cfg(target_os = "linux")]
        {
            use std::io::Write;
            for sel in &["clipboard", "primary"] {
                if let Ok(mut child) = Command::new("xclip")
                    .arg("-selection")
                    .arg(sel)
                    .stdin(std::process::Stdio::piped())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn()
                {
                    if let Some(mut stdin) = child.stdin.take() {
                        let _ = stdin.write_all(path.as_bytes());
                    }
                }
            }
        }

        if let Ok(mut clipboard) = Clipboard::new() {
            let _ = clipboard.set_text(path.to_string());
        }

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
