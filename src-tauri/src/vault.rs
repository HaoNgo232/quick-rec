use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipRecord {
    pub id: i64,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub duration_ms: i64,
    pub width: u32,
    pub height: u32,
    pub file_size_bytes: u64,
    pub created_at: String,
}

pub struct Vault {
    conn: Mutex<Connection>,
    thumbnail_dir: PathBuf,
}

impl Vault {
    pub fn new(db_path: &Path, thumbnail_dir: &Path) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::create_dir_all(thumbnail_dir)?;

        let conn = Connection::open(db_path)
            .with_context(|| format!("Failed to open SQLite database at {:?}", db_path))?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT NOT NULL UNIQUE,
                thumbnail_path TEXT,
                duration_ms INTEGER NOT NULL DEFAULT 0,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                file_size_bytes INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
            thumbnail_dir: thumbnail_dir.to_path_buf(),
        })
    }

    pub fn save(
        &self,
        file_path: &str,
        duration_ms: i64,
        width: u32,
        height: u32,
        file_size: u64,
    ) -> Result<ClipRecord> {
        let video_path = Path::new(file_path);
        let thumb_filename = format!(
            "thumb_{}.jpg",
            chrono::Utc::now().format("%Y%m%d_%H%M%S_%f")
        );
        let thumb_path = self.thumbnail_dir.join(thumb_filename);

        let thumb_saved = Self::extract_thumbnail(video_path, &thumb_path).is_ok();
        let thumb_str = if thumb_saved {
            Some(thumb_path.to_string_lossy().to_string())
        } else {
            None
        };

        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO records (file_path, thumbnail_path, duration_ms, width, height, file_size_bytes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                file_path,
                thumb_str,
                duration_ms,
                width,
                height,
                file_size as i64
            ],
        )?;

        let id = conn.last_insert_rowid();
        let mut stmt = conn.prepare(
            "SELECT id, file_path, thumbnail_path, duration_ms, width, height, file_size_bytes, created_at 
             FROM records WHERE id = ?1",
        )?;

        let record = stmt.query_row(params![id], |row| {
            Ok(ClipRecord {
                id: row.get(0)?,
                file_path: row.get(1)?,
                thumbnail_path: row.get(2)?,
                duration_ms: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
                file_size_bytes: row.get::<_, i64>(6)? as u64,
                created_at: row.get(7)?,
            })
        })?;

        Ok(record)
    }

    pub fn list(&self, limit: usize, offset: usize) -> Result<Vec<ClipRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, file_path, thumbnail_path, duration_ms, width, height, file_size_bytes, created_at 
             FROM records 
             ORDER BY id DESC 
             LIMIT ?1 OFFSET ?2",
        )?;

        let rows = stmt.query_map(params![limit as i64, offset as i64], |row| {
            Ok(ClipRecord {
                id: row.get(0)?,
                file_path: row.get(1)?,
                thumbnail_path: row.get(2)?,
                duration_ms: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
                file_size_bytes: row.get::<_, i64>(6)? as u64,
                created_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn delete(&self, id: i64, remove_file: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        if remove_file {
            let mut stmt = conn.prepare("SELECT file_path, thumbnail_path FROM records WHERE id = ?1")?;
            if let Ok((video_p, thumb_p)) = stmt.query_row(params![id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
            }) {
                let _ = std::fs::remove_file(Path::new(&video_p));
                if let Some(t) = thumb_p {
                    let _ = std::fs::remove_file(Path::new(&t));
                }
            }
        }

        conn.execute("DELETE FROM records WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn extract_thumbnail(video_path: &Path, thumb_path: &Path) -> Result<()> {
        let status = Command::new("ffmpeg")
            .arg("-y")
            .arg("-ss")
            .arg("00:00:01")
            .arg("-i")
            .arg(video_path)
            .arg("-vframes")
            .arg("1")
            .arg("-q:v")
            .arg("2")
            .arg(thumb_path)
            .output()?;

        if status.status.success() && thumb_path.exists() {
            Ok(())
        } else {
            // If clip is shorter than 1s, try extracting at 0s
            let fallback = Command::new("ffmpeg")
                .arg("-y")
                .arg("-i")
                .arg(video_path)
                .arg("-vframes")
                .arg("1")
                .arg("-q:v")
                .arg("2")
                .arg(thumb_path)
                .output()?;
            if fallback.status.success() && thumb_path.exists() {
                Ok(())
            } else {
                anyhow::bail!("ffmpeg thumbnail extraction failed")
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_vault_crud_lifecycle() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let thumb_dir = dir.path().join("thumbs");

        let vault = Vault::new(&db_path, &thumb_dir).unwrap();

        // 1. Initially empty
        let records = vault.list(10, 0).unwrap();
        assert_eq!(records.len(), 0);

        // 2. Insert record
        let dummy_clip = dir.path().join("clip.mp4");
        std::fs::write(&dummy_clip, b"fake video content").unwrap();

        let rec = vault
            .save(&dummy_clip.to_string_lossy(), 5000, 1920, 1080, 1024)
            .unwrap();
        assert_eq!(rec.width, 1920);
        assert_eq!(rec.height, 1080);
        assert_eq!(rec.duration_ms, 5000);

        // 3. List contains record
        let records = vault.list(10, 0).unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].id, rec.id);

        // 4. Delete record
        vault.delete(rec.id, false).unwrap();
        let records = vault.list(10, 0).unwrap();
        assert_eq!(records.len(), 0);
    }
}
