// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::io::Write;
use dirs;

// CHAT GPT LETS GOO
#[tauri::command]
fn spawn_desktop_file(params: serde_json::Value) -> Result<String, String> {
    // Extract the filename and content from the parameters
    let filename = params["filename"].as_str().ok_or("Missing filename")?;
    let content = params["content"].as_str().ok_or("Missing content")?;

    // Get the user's desktop directory
    let desktop_dir = dirs::desktop_dir().ok_or("Desktop directory not found")?;

    // Construct the full path for the file on the desktop
    let file_path = desktop_dir.join(filename);

    // Open the file for writing
    let mut file = fs::File::create(&file_path).map_err(|e| e.to_string())?;

    // Write the content to the file
    file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;

    // Return a success message
    Ok(format!("File '{}' saved to the desktop.", filename))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![spawn_desktop_file])
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
