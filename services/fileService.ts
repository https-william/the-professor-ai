
import { ProcessedFile } from '../types';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    JSZip: any;
  }
}

// Helper to determine mime type from extension if the blob is generic
const getMimeFromExtension = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (ext === 'txt') return 'text/plain';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    return '';
};

export const processFile = async (file: File, onProgress?: (percent: number) => void): Promise<ProcessedFile> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Helper to safely call onProgress
  const reportProgress = (p: number) => {
    if (onProgress) onProgress(p);
  };

  // Handle ZIP Archives (Recursive Batch Processing)
  if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
      const text = await extractTextFromZip(file, reportProgress);
      return { type: 'TEXT', content: text, name: file.name };
  }

  // Handle PDF
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const text = await extractTextFromPdf(file, reportProgress);
    return { type: 'TEXT', content: text, name: file.name };
  }
  
  // Handle DOCX
  else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    const text = await extractTextFromDocx(file, reportProgress);
    return { type: 'TEXT', content: text, name: file.name };
  }
  
  // Handle PPTX
  else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
    const text = await extractTextFromPptx(file, reportProgress);
    return { type: 'TEXT', content: text, name: file.name };
  }
  
  // Handle Legacy DOC (Binary)
  else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
     throw new Error("Legacy .doc files are not supported in the browser. Please save as .docx or .pdf and try again.");
  }

  // Handle Images
  else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp)$/)) {
    const base64 = await fileToBase64(file, reportProgress);
    return { type: 'IMAGE', content: base64, mimeType: fileType, name: file.name };
  }
  
  // Handle Plain Text
  else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    reportProgress(50);
    const text = await file.text();
    reportProgress(100);
    return { type: 'TEXT', content: text, name: file.name };
  }

  throw new Error(`Unsupported file type: ${file.name}. Please upload PDF, DOCX, PPTX, TXT, ZIP or Image files.`);
};

// --- EXTRACTORS ---

const extractTextFromZip = async (file: File, onProgress: (p: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        if (!window.JSZip) {
            reject(new Error("ZIP Library failed to load."));
            return;
        }

        try {
            const zip = new window.JSZip();
            const content = await zip.loadAsync(file);
            let fullTranscript = `--- ARCHIVE: ${file.name} ---\n\n`;
            
            const filesToProcess: { name: string, obj: any }[] = [];
            
            // 1. Identify valid files
            content.forEach((relativePath: string, zipEntry: any) => {
                const name = zipEntry.name.toLowerCase();
                if (!zipEntry.dir && !name.startsWith('__macosx') && !name.includes('.ds_store')) {
                    if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.pptx') || name.endsWith('.txt')) {
                        filesToProcess.push({ name: zipEntry.name, obj: zipEntry });
                    }
                }
            });

            if (filesToProcess.length === 0) {
                reject(new Error("No supported files (PDF, DOCX, PPTX, TXT) found in ZIP archive."));
                return;
            }

            // 2. Process sequentially to report progress
            for (let i = 0; i < filesToProcess.length; i++) {
                const entry = filesToProcess[i];
                const blob = await entry.obj.async('blob');
                
                // Create a pseudo-File object to reuse existing extractors
                const mime = getMimeFromExtension(entry.name);
                const pseudoFile = new File([blob], entry.name, { type: mime });

                try {
                    // We reuse processFile but ignore its internal progress (we manage global progress here)
                    const processed = await processFile(pseudoFile, () => {});
                    fullTranscript += `\n\n=== FILE: ${entry.name} ===\n${processed.content}`;
                } catch (e) {
                    console.warn(`Failed to process ${entry.name} inside zip`, e);
                    fullTranscript += `\n\n=== FILE: ${entry.name} [SKIPPED - ERROR] ===\n`;
                }

                // Update Progress
                const percent = Math.round(((i + 1) / filesToProcess.length) * 100);
                onProgress(percent);
                
                // Yield to UI
                await new Promise(r => setTimeout(r, 10));
            }

            resolve(fullTranscript);

        } catch (e) {
            reject(e);
        }
    });
};

const extractTextFromPdf = async (file: File, onProgress: (p: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.pdfjsLib) {
      reject(new Error("PDF Library failed to load. Please refresh the page."));
      return;
    }
    // Failsafe worker init
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
       window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
       if (event.lengthComputable) {
         // Map reading to 0-50%
         onProgress((event.loaded / event.total) * 50);
       }
    };

    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        
        onProgress(60); // PDF Loaded

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
          
          // Map parsing to 60-100%
          const percentage = 60 + Math.round((i / pdf.numPages) * 40);
          onProgress(percentage);
        }

        if (fullText.trim().length === 0) {
           reject(new Error("No text found in PDF. It might be an image-based PDF. Try taking a screenshot and uploading as an image."));
        } else {
          resolve(fullText);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromDocx = async (file: File, onProgress: (p: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.mammoth) {
      reject(new Error("DOCX Library failed to load."));
      return;
    }
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
       if (event.lengthComputable) {
         onProgress((event.loaded / event.total) * 80);
       }
    };

    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then((result: any) => {
           onProgress(100);
           resolve(result.value);
        })
        .catch((err: any) => reject(err));
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromPptx = async (file: File, onProgress: (p: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.JSZip) {
      reject(new Error("PPTX Parsing Library (JSZip) failed to load."));
      return;
    }

    const reader = new FileReader();

    reader.onprogress = (event) => {
       if (event.lengthComputable) {
         onProgress((event.loaded / event.total) * 50);
       }
    };

    reader.onload = async (event) => {
      try {
        const zip = new window.JSZip();
        const content = await zip.loadAsync(event.target?.result);
        onProgress(70);

        let fullText = "";
        const slideFiles: any[] = [];

        // Find all slide XML files
        zip.folder("ppt/slides")?.forEach((relativePath: string, file: any) => {
          if (relativePath.match(/^slide\d+\.xml$/)) {
            slideFiles.push({ path: relativePath, file: file });
          }
        });

        // Sort slides
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.path.match(/slide(\d+)\.xml/)[1]);
          const numB = parseInt(b.path.match(/slide(\d+)\.xml/)[1]);
          return numA - numB;
        });

        // Extract text
        for (let i = 0; i < slideFiles.length; i++) {
          const slide = slideFiles[i];
          const xmlContent = await slide.file.async("string");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
          
          const textNodes = xmlDoc.getElementsByTagName("a:t");
          let slideText = "";
          for (let j = 0; j < textNodes.length; j++) {
             slideText += textNodes[j].textContent + " ";
          }
          if (slideText.trim()) {
            fullText += `[Slide]: ${slideText.trim()}\n\n`;
          }
          
          // Map parsing to 70-100%
          const percentage = 70 + Math.round(((i + 1) / slideFiles.length) * 30);
          onProgress(percentage);
        }

        if (fullText.trim().length === 0) {
           reject(new Error("No text found in presentation."));
        } else {
           resolve(fullText);
        }

      } catch (err) {
        console.error(err);
        reject(new Error("Failed to parse PPTX file."));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const fileToBase64 = (file: File, onProgress: (p: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
       if (event.lengthComputable) {
         onProgress((event.loaded / event.total) * 90);
       }
    };

    reader.readAsDataURL(file);
    reader.onload = () => {
      onProgress(100);
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
