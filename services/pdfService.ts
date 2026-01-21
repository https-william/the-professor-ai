export const extractTextFromPdf = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Lazy load PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Worker Configuration for Vite
      // This URL construction is standard for Vite + PDF.js to ensure the worker is bundled correctly
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          // Map reading to 0-50%
          onProgress((event.loaded / event.total) * 50);
        }
      };

      reader.onload = async (event) => {
        try {
          const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
          
          const loadingTask = pdfjsLib.getDocument({
             data: typedarray,
             cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/', // Keep CMaps on CDN to save ~1MB bundle size
             cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          let fullText = '';
          
          if (onProgress) onProgress(60); 

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
            
            if (onProgress) {
                 const percentage = 60 + Math.round((i / pdf.numPages) * 40);
                 onProgress(percentage);
            }
          }

          if (fullText.trim().length === 0) {
            reject(new Error("This appears to be an image-only PDF. Please use the Camera Scan feature instead."));
          } else {
            resolve(fullText);
          }
        } catch (error: any) {
          console.error("PDF Parsing Error:", error);
          if (error.name === 'MissingPDFException') {
              reject(new Error("PDF file is corrupted or unreadable."));
          } else {
              reject(new Error("Failed to process PDF: " + error.message));
          }
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file from disk."));
      reader.readAsArrayBuffer(file);

    } catch (e: any) {
        console.error("PDF Engine Load Error:", e);
        reject(new Error("Failed to load PDF Engine. Please check your connection."));
    }
  });
};
