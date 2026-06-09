// Static imports removed for bundle size optimization
// Using dynamic imports within functions

export interface PDFExportOptions {
    title: string;
    filename: string;
    author?: string;
    themeColor?: string;
    markdownContent?: string; // Optional: if provided, we call the backend API for a beautiful vector PDF!
}

/**
 * Helper to monkeypatch getComputedStyle so html2canvas doesn't crash on oklab/oklch colors.
 */
function patchGetComputedStyle(win: any) {
    if (!win || !win.getComputedStyle || win.__patchedGetComputedStyle) return;
    const orig = win.getComputedStyle;
    win.getComputedStyle = function(el: any, pseudo: any) {
        const computed = orig.call(win, el, pseudo);
        return new Proxy(computed, {
            get(target, prop) {
                const val = target[prop as any];
                if (typeof val === 'function') {
                    return function(...args: any[]) {
                        const result = target[prop as any](...args);
                        if (typeof result === 'string' && (result.includes('oklab(') || result.includes('oklch('))) {
                            return result.replace(/oklab\([^)]+\)/g, 'rgb(128, 128, 128)').replace(/oklch\([^)]+\)/g, 'rgb(128, 128, 128)');
                        }
                        return result;
                    };
                }
                if (typeof val === 'string' && (val.includes('oklab(') || val.includes('oklch('))) {
                    return val.replace(/oklab\([^)]+\)/g, 'rgb(128, 128, 128)').replace(/oklch\([^)]+\)/g, 'rgb(128, 128, 128)');
                }
                return val;
            }
        });
    };
    win.__patchedGetComputedStyle = true;
}

/**
 * High-fidelity PDF Bridge
 * Uses jsPDF for document structure and html2canvas for rich component rendering.
 */
export async function exportToPDF(elementId: string, options: PDFExportOptions): Promise<void> {
    if (options.markdownContent) {
        // High-fidelity vector PDF generation via backend API
        const res = await fetch("/api/export/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: options.title,
                content: options.markdownContent,
                watermark: "The Professor AI | Your notes. Just the good parts."
            })
        });

        if (!res.ok) {
            throw new Error("Failed to generate PDF from server.");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filename = options.filename.endsWith(".pdf") ? options.filename : `${options.filename}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found for PDF export.`);
    }

    try {
        patchGetComputedStyle(window);
        const html2canvas = (await import("html2canvas")).default;
        
        // Use a more robust import for jsPDF to avoid Turbopack HMR factory issues
        const { jsPDF } = await import("jspdf");

        // Optimize for high-fidelity capture
        const canvas = await html2canvas(element, {
            scale: 2, // Higher density for crisp text
            useCORS: true,
            backgroundColor: "#040406", // Deep brand black
            logging: false,
            onclone: (clonedDoc) => {
                patchGetComputedStyle(clonedDoc.defaultView);
                const el = clonedDoc.getElementById(elementId);
                if (el) {
                    el.style.display = "block";
                    el.style.padding = "40px";
                    
                    // Inject professional watermark into the clone
                    const watermark = clonedDoc.createElement("div");
                    watermark.style.position = "fixed";
                    watermark.style.top = "50%";
                    watermark.style.left = "50%";
                    watermark.style.transform = "translate(-50%, -50%) rotate(-30deg)";
                    watermark.style.fontSize = "40px";
                    watermark.style.fontWeight = "900";
                    watermark.style.color = "rgba(255, 255, 255, 0.03)";
                    watermark.style.zIndex = "0";
                    watermark.style.pointerEvents = "none";
                    watermark.style.whiteSpace = "nowrap";
                    watermark.style.textTransform = "uppercase";
                    watermark.style.letterSpacing = "1em";
                    watermark.innerHTML = "THE PROFESSOR AI • VERIFIED INTELLECTUAL ASSET";
                    el.appendChild(watermark);

                    // Add branding badge to the top right
                    const badge = clonedDoc.createElement("div");
                    badge.style.position = "absolute";
                    badge.style.top = "40px";
                    badge.style.right = "40px";
                    badge.style.padding = "8px 16px";
                    badge.style.borderRadius = "12px";
                    badge.style.background = "rgba(255, 255, 255, 0.1)";
                    badge.style.border = "1px solid rgba(255, 255, 255, 0.2)";
                    badge.style.color = "#FFFFFF";
                    badge.style.fontSize = "10px";
                    badge.style.fontWeight = "900";
                    badge.style.textTransform = "uppercase";
                    badge.style.letterSpacing = "0.2em";
                    badge.innerHTML = "Verified Capture";
                    el.appendChild(badge);

                    // Add branding footer to the clone
                    const footer = clonedDoc.createElement("div");
                    footer.style.marginTop = "80px";
                    footer.style.paddingTop = "30px";
                    footer.style.borderTop = "1px solid rgba(255, 255, 255, 0.1)";
                    footer.style.display = "flex";
                    footer.style.justifyContent = "space-between";
                    footer.style.alignItems = "center";
                    footer.style.color = "rgba(255, 255, 255, 0.3)";
                    footer.style.fontSize = "10px";
                    footer.style.fontWeight = "bold";
                    footer.style.textTransform = "uppercase";
                    footer.style.letterSpacing = "0.2em";
                    footer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="/favicon-96x96.png" style="width: 24px; height: 24px; border-radius: 6px; object-fit: contain;" alt="The Professor Logo" onerror="this.src='/favicon.ico';">
                            <span>The Professor AI | Your notes. Just the good parts.</span>
                        </div>
                        <div>theprofessor.xyz</div>
                    `;
                    el.appendChild(footer);
                }
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
            subject: "Academic Strategy Material",
            author: options.author || "The Professor",
            creator: "The Professor AI Intelligence Platform"
        });

        // Add the image to PDF
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        // Save
        const safeFilename = options.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(safeFilename.endsWith(".pdf") ? safeFilename : `${safeFilename}.pdf`);
        
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
