use tauri::menu::{MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::Emitter;
use tauri::Manager;

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Build menu
            let handle = app.handle();
            let file_menu = SubmenuBuilder::new(handle, "File")
                .item(&MenuItem::with_id(
                    handle,
                    "open_file",
                    "Open File…",
                    true,
                    Some("CmdOrCtrl+O"),
                )?)
                .item(&MenuItem::with_id(
                    handle,
                    "export",
                    "Export SRT…",
                    true,
                    Some("CmdOrCtrl+S"),
                )?)
                .separator()
                .quit()
                .build()?;

            let menu = MenuBuilder::new(handle).item(&file_menu).build()?;

            app.set_menu(menu)?;

            app.on_menu_event(|app, event| match event.id().as_ref() {
                "open_file" => {
                    app.get_webview_window("main")
                        .unwrap()
                        .emit("menu-open-file", ())
                        .unwrap();
                }
                "export" => {
                    app.get_webview_window("main")
                        .unwrap()
                        .emit("menu-export", ())
                        .unwrap();
                }
                _ => {}
            });

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running SubText");
}
