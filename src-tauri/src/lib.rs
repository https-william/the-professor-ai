use std::io::Read;

#[tauri::command]
async fn extract_document_text(file_path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = std::path::Path::new(&file_path);
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "txt" | "md" => {
                std::fs::read_to_string(path)
                    .map_err(|e| format!("Failed to read text file: {}", e))
            }
            "pdf" => {
                pdf_extract::extract_text(path)
                    .map_err(|e| format!("Failed to extract PDF text: {}", e))
            }
            "docx" => {
                extract_docx_text(path)
            }
            "pptx" => {
                extract_pptx_text(path)
            }
            _ => Err(format!("Unsupported file extension: .{}", extension)),
        }
    })
    .await
    .map_err(|e| format!("Background thread crashed: {}", e))?
}

fn extract_docx_text(path: &std::path::Path) -> Result<String, String> {
    let file = std::fs::File::open(path).map_err(|e| format!("Failed to open DOCX: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid DOCX zip archive: {}", e))?;
    
    let mut document_file = archive.by_name("word/document.xml")
        .map_err(|e| format!("Missing word/document.xml in DOCX structure: {}", e))?;
    let mut contents = String::new();
    document_file.read_to_string(&mut contents).map_err(|e| format!("Failed to read document XML: {}", e))?;
    
    let mut extracted = String::new();
    let bytes = contents.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if i + 5 <= bytes.len() && &bytes[i..i+5] == b"<w:t>" {
            i += 5;
            let start = i;
            while i + 6 <= bytes.len() && &bytes[i..i+6] != b"</w:t>" {
                i += 1;
            }
            let text = String::from_utf8_lossy(&bytes[start..i]);
            extracted.push_str(&text);
            extracted.push(' ');
            i += 6;
        } else if i + 4 <= bytes.len() && &bytes[i..i+4] == b"<w:t" {
            while i < bytes.len() && bytes[i] != b'>' {
                i += 1;
            }
            if i < bytes.len() {
                i += 1;
                let start = i;
                while i + 6 <= bytes.len() && &bytes[i..i+6] != b"</w:t>" {
                    i += 1;
                }
                let text = String::from_utf8_lossy(&bytes[start..i]);
                extracted.push_str(&text);
                extracted.push(' ');
                i += 6;
            }
        } else {
            i += 1;
        }
    }
    
    Ok(extracted.trim().to_string())
}

fn extract_pptx_text(path: &std::path::Path) -> Result<String, String> {
    let file = std::fs::File::open(path).map_err(|e| format!("Failed to open PPTX: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid PPTX zip archive: {}", e))?;
    let mut extracted = String::new();

    for idx in 0..archive.len() {
        let mut file = archive.by_index(idx).map_err(|e| format!("Error accessing slide index {}: {}", idx, e))?;
        let name = file.name().to_string();
        if name.starts_with("ppt/slides/slide") && name.ends_with(".xml") {
            let mut contents = String::new();
            file.read_to_string(&mut contents).map_err(|e| format!("Error reading slide content {}: {}", name, e))?;
            
            let bytes = contents.as_bytes();
            let mut i = 0;
            while i < bytes.len() {
                if i + 5 <= bytes.len() && &bytes[i..i+5] == b"<a:t>" {
                    i += 5;
                    let start = i;
                    while i + 6 <= bytes.len() && &bytes[i..i+6] != b"</a:t>" {
                        i += 1;
                    }
                    let text = String::from_utf8_lossy(&bytes[start..i]);
                    extracted.push_str(&text);
                    extracted.push(' ');
                    i += 6;
                } else if i + 4 <= bytes.len() && &bytes[i..i+4] == b"<a:t" {
                    while i < bytes.len() && bytes[i] != b'>' {
                        i += 1;
                    }
                    if i < bytes.len() {
                        i += 1;
                        let start = i;
                        while i + 6 <= bytes.len() && &bytes[i..i+6] != b"</a:t>" {
                            i += 1;
                        }
                        let text = String::from_utf8_lossy(&bytes[start..i]);
                        extracted.push_str(&text);
                        extracted.push(' ');
                        i += 6;
                    }
                } else {
                    i += 1;
                }
            }
            extracted.push('\n');
        }
    }
    
    Ok(extracted.trim().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![extract_document_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
