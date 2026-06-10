import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title = "Study Guide", content = "", watermark = "" } = body;

        // Read logo image and convert to base64 Data URL for standalone document rendering
        let logoDataUrl = "";
        try {
            const logoPath = path.join(process.cwd(), "public", "favicon-96x96.png");
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
            }
        } catch (err) {
            console.error("Failed to read logo image for PDF:", err);
        }

        // Pre-process content to convert [KNOWLEDGE_CHECK] JSON blocks into beautiful HTML callout boxes
        let processedContent = content;
        if (processedContent) {
            // Clean up "Checking Understanding" headings that often precede knowledge checks
            processedContent = processedContent.replace(/([#*\s_]*)(Checking\s+Understanding|CHECKINGUNDERSTANDING|CheckingUnderstanding|checking\s+understanding)([#*\s_:]*)(\n|$)/gi, "\n");

            processedContent = processedContent.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, (match: string, jsonStr: string) => {
                try {
                    const parsed = JSON.parse(jsonStr);
                    const question = parsed.question || "";
                    const options = parsed.options || [];
                    const correctIndex = parsed.correctIndex ?? 0;
                    
                    let markdown = `\n\n> 💡 **Professor's Spot Check**\n> \n> **Question:** ${question}\n> \n`;
                    options.forEach((opt: string, idx: number) => {
                        if (idx === correctIndex) {
                            markdown += `> * **✓ ${opt} (Correct)**\n`;
                        } else {
                            markdown += `> * ${opt}\n`;
                        }
                    });
                    markdown += `\n`;
                    return markdown;
                } catch (e) {
                    // If JSON parsing fails, remove the block entirely to avoid leaking raw JSON
                    return "";
                }
            });
            // Clean up any stray [KNOWLEDGE_CHECK] tags without valid JSON
            processedContent = processedContent.replace(/\[KNOWLEDGE_CHECK\]/g, "");
        }

        // Render HTML for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <!-- Include Marked.js to parse markdown on the fly -->
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <!-- Google Fonts -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                
                <style>
                    :root {
                        --bg: #0C0C16;
                        --foreground: #FFFFFF;
                        --foreground-muted: rgba(255, 255, 255, 0.7);
                        --blue: #000000;
                    }
                    @page {
                        size: A4;
                        margin: 25mm 20mm 25mm 20mm;
                    }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        color: #1a1a1a;
                        background: #ffffff;
                        line-height: 1.6;
                        padding: 0;
                        margin: 0;
                    }
                    body::after {
                        content: "THE PROFESSOR AI • JUST THE GOOD PARTS";
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-30deg);
                        font-family: 'Outfit', sans-serif;
                        font-size: 3rem;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.04);
                        z-index: -1000;
                        pointer-events: none;
                        white-space: nowrap;
                        letter-spacing: 0.25em;
                        text-transform: uppercase;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        font-family: 'Outfit', sans-serif;
                        color: #000000;
                        margin-top: 1.8em;
                        margin-bottom: 0.6em;
                        page-break-after: avoid;
                        break-after: avoid;
                    }
                    h1 { font-size: 2.4rem; font-weight: 900; }
                    h2 { font-size: 1.8rem; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; margin-top: 2.2em; }
                    h3 { font-size: 1.3rem; font-weight: 700; margin-top: 1.6em; }
                    p { margin-bottom: 1.2em; orphans: 3; widows: 3; }
                    ul, ol { margin-bottom: 1.2em; padding-left: 1.5em; }
                    li { margin-bottom: 0.5em; page-break-inside: avoid; break-inside: avoid; }
                    strong { color: #000; }
                    blockquote {
                        border-left: 4px solid var(--blue);
                        margin: 1.5em 0;
                        padding: 0.8em 1.2em;
                        background: #f8fafc;
                        font-style: italic;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    code {
                        font-family: monospace;
                        background: #f1f5f9;
                        padding: 0.2em 0.4em;
                        border-radius: 4px;
                        font-size: 0.9em;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 2rem 0;
                        font-size: 0.95rem;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        overflow: hidden;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    th {
                        background-color: #f1f5f9;
                        color: #0f172a;
                        font-weight: 700;
                        text-align: left;
                        padding: 12px 16px;
                        border-bottom: 2px solid #e2e8f0;
                        border-right: 1px solid #e2e8f0;
                    }
                    td {
                        padding: 12px 16px;
                        border-bottom: 1px solid #e2e8f0;
                        border-right: 1px solid #e2e8f0;
                        color: #334155;
                    }
                    tr:last-child td {
                        border-bottom: none;
                    }
                    tr td:last-child, tr th:last-child {
                        border-right: none;
                    }
                    tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    pre {
                        background: #1e293b;
                        color: #f8fafc;
                        padding: 1.2em;
                        border-radius: 8px;
                        overflow-x: auto;
                        margin: 1.5em 0;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    pre code {
                        background: transparent;
                        color: inherit;
                        padding: 0;
                    }
                    .knowledge-check-box {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .header-container {
                        text-align: center;
                        margin-top: 1.5rem;
                        margin-bottom: 3rem;
                        padding-bottom: 2rem;
                        border-bottom: 2px solid #000000;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .header-title {
                        font-size: 2.2rem;
                        font-weight: 900;
                        margin: 0;
                        letter-spacing: -0.02em;
                        text-transform: uppercase;
                    }
                    .watermark-footer {
                        text-align: center;
                        margin-top: 4rem;
                        padding-bottom: 2rem;
                        border-top: 1px solid #e2e8f0;
                        font-size: 0.85rem;
                        color: #64748b;
                        font-style: italic;
                        line-height: 1.6;
                    }
                    .brand-name {
                        font-family: 'Outfit', sans-serif;
                        font-weight: 900;
                        color: #000000;
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    ${logoDataUrl ? `<img src="${logoDataUrl}" style="width: 48px; height: 48px; margin-bottom: 1.2rem; object-fit: contain; border-radius: 8px;" alt="The Professor Logo" />` : ''}
                    <h1 class="header-title">${title}</h1>
                    <p style="color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; font-size: 0.75rem; margin-top: 0.5rem; font-family: 'Outfit', sans-serif; margin-bottom: 0;">Your notes. Just the good parts. • <span class="brand-name">The Professor AI</span></p>
                </div>
                
                <div id="content-rendered"></div>

                <div class="watermark-footer">
                    ${watermark || "The Professor AI | Your notes. Just the good parts."}<br/>
                    <a href="https://theprofessor.xyz" style="color: #000000; text-decoration: none; font-weight: bold; margin-top: 0.5em; display: inline-block; font-size: 0.8rem; letter-spacing: 0.05em;">theprofessor.xyz</a>
                </div>

                <script>
                    const rawMarkdown = ${JSON.stringify(processedContent)};
                    document.getElementById('content-rendered').innerHTML = marked.parse(rawMarkdown);
                </script>
            </body>
            </html>
        `;

        // Launch playwright and generate PDF
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: "networkidle" });
        
        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "25mm",
                right: "20mm",
                bottom: "25mm",
                left: "20mm"
            },
            printBackground: true
        });

        await browser.close();

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Study_Guide.pdf"`,
                "Content-Length": pdfBuffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error("PDF Export Route Error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF", details: error.message },
            { status: 500 }
        );
    }
}
