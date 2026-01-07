
// Declaration for window.pdfjsLib since we are loading it via script tag
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Check Library
    if (!window.pdfjsLib) {
      reject(new Error("PDF Engine offline. Please refresh the page."));
      return;
    }

    // 2. FORCE Worker Source (Fixes 'No Internet' / 404 errors on workers)
    // We use unpkg as a reliable CDN.
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        
        // 3. Load Document with explicit params to prevent network fetch errors
        const loadingTask = window.pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }

        if (fullText.trim().length === 0) {
          reject(new Error("This appears to be an image-only PDF. Please use the Camera Scan feature instead."));
        } else {
          resolve(fullText);
        }
      } catch (error: any) {
        console.error("PDF Parse Error:", error);
        if (error.name === 'MissingPDFException') {
            reject(new Error("PDF file is corrupted or unreadable."));
        } else {
            reject(new Error("Failed to process PDF. Ensure you have an active internet connection for the PDF engine."));
        }
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file from disk."));
    reader.readAsArrayBuffer(file);
  });
};
