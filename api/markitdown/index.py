import os
import tempfile
from flask import Flask, request, jsonify
from markitdown import MarkItDown
from werkzeug.utils import secure_filename

app = Flask(__name__)

class SmartFileLoader:
    def __init__(self):
        # Initialize the "Magic" converter
        # Optimized for CPU-only, avoiding heavy ML models for type detection
        self.md = MarkItDown()

    def process_file(self, file_path):
        """
        Converts supported files (PDF, PPTX, DOCX, XLSX, CSV, TXT) 
        into AI-ready Markdown text instantly.
        """
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            # MarkItDown handles structure preservation (headers, tables) natively
            # for PDF, DOCX, PPTX, XLSX, etc.
            result = self.md.convert(file_path)
            
            # Returns clean Markdown string
            return result.text_content

        except Exception as e:
            return f"Error processing file: {str(e)}"

# Global loader instance
loader = SmartFileLoader()

@app.route('/api/markitdown', methods=['POST'])
@app.route('/', methods=['POST'])
def handle_parse():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Secure the filename and create a temporary file
    filename = secure_filename(file.filename)
    file_ext = os.path.splitext(filename)[1].lower()
    
    # Create temp directory inside the project for Vercel write access (if /tmp is restricted)
    # Actually /tmp is fine on Vercel
    with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as temp:
        file.save(temp.name)
        temp_path = temp.name
    
    try:
        # Process the file
        content = loader.process_file(temp_path)
        
        if content.startswith("Error processing file:"):
            return jsonify({"error": content}), 500
            
        return jsonify({
            "success": True,
            "text": content,
            "fileType": file_ext.replace('.', '').upper()
        })
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# For Vercel, the app object itself can be the entry point
def handler(request):
    return app(request)

if __name__ == "__main__":
    app.run(port=5000)
