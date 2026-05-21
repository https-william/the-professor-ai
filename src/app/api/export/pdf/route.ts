import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title = "Study Guide", content = "", watermark = "" } = body;

        // Pre-process content to convert [KNOWLEDGE_CHECK] JSON blocks into beautiful HTML callout boxes
        let processedContent = content;
        if (processedContent) {
            processedContent = processedContent.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, (match: string, jsonStr: string) => {
                try {
                    const parsed = JSON.parse(jsonStr);
                    const question = parsed.question || "";
                    const options = parsed.options || [];
                    const correctIndex = parsed.correctIndex ?? 0;
                    const correctAnswer = options[correctIndex] || "";
                    
                    return `\n\n<div class="knowledge-check-box" style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 1.5rem; margin: 2rem 0; border-radius: 0 12px 12px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                            <span style="background: #2563eb; color: white; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.1em;">Knowledge Check</span>
                        </div>
                        <p style="font-weight: 700; color: #0f172a; margin: 0 0 0.5rem 0; font-size: 1.1rem;">${question}</p>
                        <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 0.95rem;">✓ ${correctAnswer}</p>
                    </div>\n\n`;
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
                        --blue: #2563EB;
                    }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        color: #1a1a1a;
                        background: #ffffff;
                        line-height: 1.6;
                        padding: 40px;
                        margin: 0;
                    }
                    h1, h2, h3, h4 {
                        font-family: 'Outfit', sans-serif;
                        color: #000000;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    h1 { font-size: 2.5rem; font-weight: 900; }
                    h2 { font-size: 1.8rem; font-weight: 800; border-bottom: 2px solid #f0f0f0; padding-bottom: 0.3em; }
                    h3 { font-size: 1.4rem; font-weight: 700; }
                    p { margin-bottom: 1em; }
                    ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
                    li { margin-bottom: 0.5em; }
                    strong { color: #000; }
                    blockquote {
                        border-left: 4px solid var(--blue);
                        margin: 1.5em 0;
                        padding: 0.5em 1em;
                        background: #f8fafc;
                        font-style: italic;
                    }
                    code {
                        font-family: monospace;
                        background: #f1f5f9;
                        padding: 0.2em 0.4em;
                        border-radius: 4px;
                        font-size: 0.9em;
                    }
                    pre {
                        background: #1e293b;
                        color: #f8fafc;
                        padding: 1em;
                        border-radius: 8px;
                        overflow-x: auto;
                    }
                    pre code {
                        background: transparent;
                        color: inherit;
                        padding: 0;
                    }
                    .header-container {
                        text-align: center;
                        margin-bottom: 3rem;
                        padding-bottom: 1rem;
                        border-bottom: 4px solid var(--blue);
                    }
                    .header-title {
                        font-size: 3rem;
                        font-weight: 900;
                        font-style: italic;
                        margin: 0 0 0.2em 0;
                    }
                    .watermark-footer {
                        text-align: center;
                        margin-top: 4rem;
                        padding-bottom: 2rem;
                        border-top: 1px solid #e2e8f0;
                        font-size: 0.85rem;
                        color: #64748b;
                        font-style: italic;
                    }
                    .brand-name {
                        font-family: 'Outfit', sans-serif;
                        font-weight: 900;
                        color: var(--blue);
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <h1 class="header-title">${title}</h1>
                    <p style="color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Generated by <span class="brand-name">The Professor AI</span></p>
                </div>
                
                <div id="content-rendered"></div>

                <div class="watermark-footer">
                    ${watermark || "The Professor AI | Your notes. Just the good parts."}<br/>
                    <a href="https://theprofessor.xyz" style="color: var(--blue); text-decoration: none; font-weight: bold; margin-top: 0.5em; display: inline-block;">theprofessor.xyz</a>
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
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
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
