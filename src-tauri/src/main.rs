#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use quick_rec_lib::deskboard::Deskboard;
use quick_rec_lib::recorder::Recorder;
use quick_rec_lib::vault::{ClipRecord, Vault};
use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub struct AppState {
    pub recorder: Arc<Recorder>,
    pub vault: Arc<Vault>,
}

#[tauri::command]
fn list_records(
    state: State<AppState>,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<ClipRecord>, String> {
    state
        .vault
        .list(limit.unwrap_or(50), offset.unwrap_or(0))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_record(state: State<AppState>, id: i64, remove_file: Option<bool>) -> Result<(), String> {
    state
        .vault
        .delete(id, remove_file.unwrap_or(true))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn copy_path(path: String) -> Result<(), String> {
    Deskboard::copy_path(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(path).spawn();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("explorer").arg(path).spawn();
    Ok(())
}

#[tauri::command]
fn is_recording(state: State<AppState>) -> bool {
    state.recorder.is_recording()
}

#[tauri::command]
fn toggle_record(app: AppHandle, state: State<AppState>) -> Result<bool, String> {
    handle_toggle_record(&app, &state.recorder, &state.vault)
}

fn handle_toggle_record(
    app: &AppHandle,
    recorder: &Arc<Recorder>,
    vault: &Arc<Vault>,
) -> Result<bool, String> {
    if recorder.is_recording() {
        let (output_file, duration_ms, rect, file_size) =
            recorder.stop().map_err(|e| e.to_string())?;
        Deskboard::play_sound_stop();
        let path_str = output_file.to_string_lossy().to_string();
        let _ = Deskboard::copy_path(&path_str);
        let _ = vault.save(&path_str, duration_ms, rect.width, rect.height, file_size);
        let _ = app.emit("recordings-updated", ());
        Ok(false)
    } else {
        let rect = match Recorder::pick_region().map_err(|e| e.to_string())? {
            Some(r) => r,
            None => return Ok(false),
        };

        let video_dir = dirs::video_dir().unwrap_or_else(|| {
            dirs::home_dir().map(|h| h.join("Videos")).unwrap_or_default()
        });
        let filename = format!("clip_{}.mp4", chrono::Local::now().format("%Y%m%d_%H%M%S"));
        let output_file = video_dir.join(filename);

        recorder
            .start(rect, &output_file)
            .map_err(|e| e.to_string())?;
        Deskboard::play_sound_start();
        Ok(true)
    }
}

fn main() {
    let data_dir = dirs::data_dir()
        .map(|d| d.join("quick-rec"))
        .unwrap_or_else(|| dirs::home_dir().unwrap().join(".quick-rec"));
    let db_path = data_dir.join("vault.db");
    let thumb_dir = data_dir.join("thumbnails");

    let vault = Arc::new(Vault::new(&db_path, &thumb_dir).expect("Failed to initialize Vault database"));
    let recorder = Arc::new(Recorder::new());

    let state = AppState {
        recorder: recorder.clone(),
        vault: vault.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            list_records,
            delete_record,
            copy_path,
            open_file,
            is_recording,
            toggle_record
        ])
        .setup(move |app| {
            // 1. Setup System Tray
            let toggle_item = MenuItem::with_id(app, "toggle_rec", "Quay màn hình (Super+Shift+R)", true, None::<&str>)?;
            let history_item = MenuItem::with_id(app, "open_history", "Lịch sử quay (History Vault)", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Thoát Quick Rec", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&toggle_item, &history_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Quick Screen Recorder")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle_rec" => {
                        let state = app.state::<AppState>();
                        let _ = handle_toggle_record(app, &state.recorder, &state.vault);
                    }
                    "open_history" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // 2. Register Global Shortcut: Super+Shift+R
            let shortcut = "Super+Shift+R".parse::<Shortcut>().expect("Invalid shortcut format");
            let app_handle = app.handle().clone();
            let recorder_clone = recorder.clone();
            let vault_clone = vault.clone();

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                let _ = handle_toggle_record(&app_handle, &recorder_clone, &vault_clone);
            })?;

            // 3. Intercept main window close event so it minimizes to tray instead of quitting
            if let Some(win) = app.get_webview_window("main") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error running Quick Rec application");
}
