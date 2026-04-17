/**
 * Library Export Utilities
 * Handles the generation of study materials in various formats (primarily PDF).
 */

export interface ExportItem {
    id: string;
    title: string;
    type: 'flashcards' | 'quiz' | 'summary';
    content: any;
    created_at: string;
}

/**
 * Formats multiple library items into a printable HTML structure.
 * This is designed to be rendered in a hidden iframe and then printed to PDF by the browser.
 */
export const generateLibraryExportHTML = (items: ExportItem[]): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Professor - Study Export</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        body {
            font-family: 'Inter', system-ui, sans-serif;
            color: #1a1a1a;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #f3f4f6;
            margin-bottom: 40px;
            padding-bottom: 20px;
        }

        .header h1 {
            color: #6366f1;
            font-weight: 800;
            margin: 0;
            font-size: 32px;
        }

        .header p {
            color: #6b7280;
            margin: 5px 0 0;
            font-size: 14px;
        }

        .item-section {
            margin-bottom: 60px;
            page-break-inside: avoid;
        }

        .item-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .item-type {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: #e0e7ff;
            color: #4338ca;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 800;
        }

        .flashcard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }

        .flashcard {
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 12px;
            background: #f9fafb;
        }

        .flashcard .label {
            font-size: 10px;
            color: #9ca3af;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .quiz-item {
            margin-bottom: 30px;
            border-left: 4px solid #f3f4f6;
            padding-left: 20px;
        }

        .summary-text {
            white-space: pre-wrap;
            color: #374151;
            font-size: 16px;
        }

        .footer {
            margin-top: 80px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
        }

        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>The Professor</h1>
        <p>Your Intelligent Study Vault • ${new Date().toLocaleDateString()}</p>
    </div>

    ${items.map(item => `
        <div class="item-section">
            <div class="item-title">
                ${item.title || 'Untitled Material'}
                <span class="item-type">${item.type}</span>
            </div>
            
            ${item.type === 'flashcards' ? `
                <div class="flashcard-grid">
                    ${(item.content?.flashcards || []).map((card: any) => `
                        <div class="flashcard">
                            <div class="label">Question</div>
                            <div style="font-weight: 600; margin-bottom: 15px;">${card.front}</div>
                            <div class="label">Answer</div>
                            <div>${card.back}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${item.type === 'quiz' ? `
                <div class="quiz-container">
                    ${(item.content?.questions || []).map((q: any, idx: number) => `
                        <div class="quiz-item">
                            <div style="font-weight: 700; margin-bottom: 10px;">${idx + 1}. ${q.question}</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-left: 20px;">
                                ${Object.entries(q.options || {}).map(([key, value]) => `
                                    <div>[ ] ${key}: ${value}</div>
                                `).join('')}
                            </div>
                            <div style="margin-top: 10px; font-size: 12px; color: #6b7280; font-style: italic;">
                                Correct Answer: ${q.correctAnswer}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${item.type === 'summary' ? `
                <div class="summary-text">${item.content?.summary || ''}</div>
            ` : ''}
        </div>
    `).join('<hr style="border: 0; border-top: 2px dashed #f3f4f6; margin: 40px 0;"/>')}

    <div class="footer">
        Generated by The Professor • Your AI Study Companion
    </div>
</body>
</html>
    `;
};
