// Static imports removed for bundle size optimization
// Using dynamic imports within functions

export interface PDFExportOptions {
    title: string;
    filename: string;
    author?: string;
    themeColor?: string;
}

/**
 * High-fidelity PDF Bridge
 * Uses jsPDF for document structure and html2canvas for rich component rendering.
 */
export async function exportToPDF(elementId: string, options: PDFExportOptions): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found for PDF export.`);
    }

    try {
        const html2canvas = (await import("html2canvas")).default;
        
        // Use a more robust import for jsPDF to avoid Turbopack HMR factory issues
        const { jsPDF } = await import("jspdf");

        // Optimize for high-fidelity capture
        const canvas = await html2canvas(element, {
            scale: 2, // Higher density for crisp text
            useCORS: true,
            backgroundColor: "#08080E", // Match app background
            logging: false,
            onclone: (clonedDoc) => {
                // Ensure the cloned element is visible even if hidden in main DOM
                const el = clonedDoc.getElementById(elementId);
                if (el) el.style.display = "block";
            }
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add metadata
        pdf.setProperties({
            title: options.title,
            subject: "Study Material - The Professor",
            author: options.author || "The Professor",
            creator: "The Professor AI Platform"
        });

        // Add the image to PDF
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        // Save native
        pdf.save(options.filename.endsWith(".pdf") ? options.filename : `${options.filename}.pdf`);
        
    } catch (error) {
        console.error("PDF Export failed:", error);
        throw error;
    }
}

/**
 * Utility to generate a PDF from raw markdown or text (fallback/simpler version)
 */
export async function exportMarkdownToPDF(title: string, content: string, filename: string): Promise<void> {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    
    // Simple layout - real implementation should use a hidden ref to render markdown to HTML first
    pdf.setFontSize(22);
    pdf.setTextColor(245, 158, 11); // Amber
    pdf.text(title, 20, 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    // Split text into lines that fit the page width
    const splitText = pdf.splitTextToSize(content, 170);
    pdf.text(splitText, 20, 40);
    
    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
