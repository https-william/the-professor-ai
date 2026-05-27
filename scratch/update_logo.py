import base64
import os

def update_logo():
    # 1. Get base64 representation of the logo
    logo_path = r"c:\Users\cutef\Downloads\My Projects\the-professor\public\apple-touch-icon.png"
    with open(logo_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    base64_url = f"data:image/png;base64,{encoded_string}"
    
    # 2. Path to the setup guide markdown
    guide_path = r"c:\Users\cutef\.gemini\antigravity\brain\f4396212-cd2e-4fa8-9326-8892590d83d4\supabase_email_and_security_setup.md"
    
    # 3. Read content
    with open(guide_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 4. Replace image URL with base64 data URL
    target_url = "https://theprofessor.xyz/apple-touch-icon.png"
    new_content = content.replace(target_url, base64_url)
    
    # 5. Write back
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Successfully replaced {content.count(target_url)} occurrences of the logo URL with Base64.")

if __name__ == "__main__":
    update_logo()
