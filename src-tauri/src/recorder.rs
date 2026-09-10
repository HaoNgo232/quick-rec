use anyhow::{bail, Context, Result};
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl Rect {
    pub fn new(x: i32, y: i32, width: u32, height: u32) -> Self {
        Self { x, y, width, height }
    }

    pub fn normalized(&self) -> Self {
        Self {
            x: self.x,
            y: self.y,
            width: self.width - (self.width % 2),
            height: self.height - (self.height % 2),
        }
    }
}

pub struct ActiveSession {
    pub process: Child,
    pub output_file: PathBuf,
    pub rect: Rect,
    pub start_time: Instant,
    pub overlay_process: Option<Child>,
}

pub struct Recorder {
    session: Mutex<Option<ActiveSession>>,
}

impl Recorder {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(None),
        }
    }

    pub fn is_recording(&self) -> bool {
        self.session.lock().unwrap().is_some()
    }

    pub fn pick_region() -> Result<Option<Rect>> {
        #[cfg(target_os = "linux")]
        {
            let output = Command::new("slop")
                .arg("-f")
                .arg("%x %y %w %h")
                .arg("--nodecorations")
                .output();

            let output = match output {
                Ok(o) => o,
                Err(_) => bail!("slop command not found. Please install slop."),
            };

            if !output.status.success() {
                return Ok(None); // User cancelled with ESC
            }

            let text = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = text.split_whitespace().collect();
            if parts.len() < 4 {
                return Ok(None);
            }

            let x = parts[0].parse::<i32>()?;
            let y = parts[1].parse::<i32>()?;
            let w = parts[2].parse::<u32>()?;
            let h = parts[3].parse::<u32>()?;

            let rect = Rect::new(x, y, w, h).normalized();
            if rect.width < 10 || rect.height < 10 {
                return Ok(None);
            }
            Ok(Some(rect))
        }

        #[cfg(not(target_os = "linux"))]
        {
            // Fallback for Windows or non-linux (full screen / default rect)
            Ok(Some(Rect::new(0, 0, 1920, 1080)))
        }
    }

    pub fn start(&self, rect: Rect, output_file: &Path) -> Result<()> {
        let mut lock = self.session.lock().unwrap();
        if lock.is_some() {
            bail!("A recording session is already active.");
        }

        if let Some(parent) = output_file.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let rect = rect.normalized();

        #[cfg(target_os = "linux")]
        let child = {
            let display = std::env::var("DISPLAY").unwrap_or_else(|_| ":0.0".to_string());
            let input_arg = format!("{}+{},{}", display, rect.x, rect.y);
            let size_arg = format!("{}x{}", rect.width, rect.height);

            Command::new("ffmpeg")
                .arg("-y")
                .arg("-f")
                .arg("x11grab")
                .arg("-draw_mouse")
                .arg("1")
                .arg("-video_size")
                .arg(&size_arg)
                .arg("-i")
                .arg(&input_arg)
                .arg("-c:v")
                .arg("libx264")
                .arg("-preset")
                .arg("ultrafast")
                .arg("-pix_fmt")
                .arg("yuv420p")
                .arg(output_file)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .context("Failed to spawn ffmpeg")?
        };

        #[cfg(target_os = "windows")]
        let child = {
            // Windows gdigrab adapter
            Command::new("ffmpeg")
                .arg("-y")
                .arg("-f")
                .arg("gdigrab")
                .arg("-draw_mouse")
                .arg("1")
                .arg("-offset_x")
                .arg(rect.x.to_string())
                .arg("-offset_y")
                .arg(rect.y.to_string())
                .arg("-video_size")
                .arg(format!("{}x{}", rect.width, rect.height))
                .arg("-i")
                .arg("desktop")
                .arg("-c:v")
                .arg("libx264")
                .arg("-preset")
                .arg("ultrafast")
                .arg("-pix_fmt")
                .arg("yuv420p")
                .arg(output_file)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .context("Failed to spawn ffmpeg on Windows")?
        };

        #[cfg(not(any(target_os = "linux", target_os = "windows")))]
        let child = {
            bail!("Platform capture not supported");
        };

        let pid = child.id();

        // Spawn visual overlay if present
        let overlay_process = {
            let candidates = [
                std::env::current_dir().ok().map(|d| d.join("scripts/quick-rec-overlay")),
                dirs::home_dir().map(|h| h.join(".local/bin/quick-rec-overlay")),
                dirs::home_dir().map(|h| h.join(".local/bin/rec-overlay.py")),
                Some(PathBuf::from("/usr/bin/quick-rec-overlay")),
            ];
            let overlay_bin = candidates.into_iter().flatten().find(|p| p.exists());
            if let Some(bin) = overlay_bin {
                Command::new("python3")
                    .arg(bin)
                    .arg(rect.x.to_string())
                    .arg(rect.y.to_string())
                    .arg(rect.width.to_string())
                    .arg(rect.height.to_string())
                    .arg(pid.to_string())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn()
                    .ok()
            } else {
                None
            }
        };

        *lock = Some(ActiveSession {
            process: child,
            output_file: output_file.to_path_buf(),
            rect,
            start_time: Instant::now(),
            overlay_process,
        });

        Ok(())
    }

    pub fn stop(&self) -> Result<(PathBuf, i64, Rect, u64)> {
        let mut lock = self.session.lock().unwrap();
        let mut session = lock.take().context("No active recording session")?;

        // 1. Terminate overlay immediately
        if let Some(mut overlay) = session.overlay_process {
            let _ = overlay.kill();
        }

        // 2. Terminate ffmpeg cleanly (SIGINT on Unix, ctrl-c/kill on Windows)
        #[cfg(unix)]
        {
            let pid = session.process.id() as i32;
            unsafe {
                libc::kill(pid, libc::SIGINT);
            }
            let _ = session.process.wait();
        }

        #[cfg(not(unix))]
        {
            let _ = session.process.kill();
            let _ = session.process.wait();
        }

        let duration_ms = session.start_time.elapsed().as_millis() as i64;
        let file_size = std::fs::metadata(&session.output_file)
            .map(|m| m.len())
            .unwrap_or(0);

        Ok((session.output_file, duration_ms, session.rect, file_size))
    }

    pub fn cancel(&self) {
        let mut lock = self.session.lock().unwrap();
        if let Some(mut session) = lock.take() {
            if let Some(mut overlay) = session.overlay_process {
                let _ = overlay.kill();
            }
            let _ = session.process.kill();
            let _ = session.process.wait();
            let _ = std::fs::remove_file(&session.output_file);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rect_normalization_even_parity() {
        let odd_rect = Rect::new(101, 203, 801, 603);
        let normalized = odd_rect.normalized();
        assert_eq!(normalized.x, 101);
        assert_eq!(normalized.y, 203);
        assert_eq!(normalized.width, 800);
        assert_eq!(normalized.height, 602);
        assert_eq!(normalized.width % 2, 0);
        assert_eq!(normalized.height % 2, 0);

        let even_rect = Rect::new(0, 0, 1920, 1080);
        assert_eq!(even_rect.normalized(), even_rect);
    }
}
