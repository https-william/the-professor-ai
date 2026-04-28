import os
import sys
import json
from markitdown import MarkItDown

class SmartFileLoader:
    def __init__(self):
        # Initialize MarkItDown with sensible defaults for LLM readiness
        self.md = MarkItDown()

    def convert_to_markdown(self, file_path):
        """
        Converts a file to markdown, preserving structure.
        Optimized for CPU-only environments.
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        try:
            # MarkItDown handles PDF, DOCX, PPTX, XLSX, etc. automatically
            result = self.md.convert(file_path)
            
            return {
                "success": True,
                "content": result.text_content,
                "metadata": {
                    "file_path": file_path,
                    "extension": os.path.splitext(file_path)[1].lower()
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Expect file path as first argument
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    loader = SmartFileLoader()
    result = loader.convert_to_markdown(file_path)
    
    # Output as JSON for easy parsing by Node.js
    print(json.dumps(result))
