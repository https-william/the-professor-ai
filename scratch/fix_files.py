
import sys
import os

def replace_in_file(file_path, target, replacement):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target not in content:
        print(f"Target text not found in {file_path}")
        return False
    
    # Replace only the first occurrence or all? 
    # For cleanup, we want to replace the whole block.
    new_content = content.replace(target, replacement)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated {file_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python fix_files.py <file_path> <target_file_with_text> <replacement_file_with_text>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    with open(sys.argv[2], 'r', encoding='utf-8') as f:
        target = f.read()
    with open(sys.argv[3], 'r', encoding='utf-8') as f:
        replacement = f.read()
        
    replace_in_file(file_path, target, replacement)
