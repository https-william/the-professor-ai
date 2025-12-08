// Declaration for window.pdfjsLib since we are loading it via script tag
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.pdfjsLib) {
      reject(new Error("PDF Library failed to load. Please refresh the page."));
      return;
    }

    // Failsafe: Ensure workerSrc is set to avoid "Setting up fake worker failed" errors
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
       window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        
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
          reject(new Error("No text found in PDF. It might be an image-based PDF."));
        } else {
          resolve(fullText);
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};