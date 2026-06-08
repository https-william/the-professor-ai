/**
 * Offline Study Pack Download Utility
 * Compiles flashcard decks and quizzes into fully interactive, single-file HTML documents.
 * They run entirely on the client-side without any internet connection.
 */

// Helper to escape text for script/HTML injection
function escapeHtml(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function downloadFlashcardsOffline(title: string, flashcards: any[]) {
    const safeTitle = escapeHtml(title);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Offline Flashcards</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #050508;
            --card: #0c0c16;
            --border: #1a1a2e;
            --border-hover: #2a2a4e;
            --blue: #2563eb;
            --blue-dim: rgba(37, 99, 235, 0.1);
            --blue-border: rgba(37, 99, 235, 0.25);
            --blue-light: #60a5fa;
            --text: #ffffff;
            --text-muted: #8e8e9f;
            --accent: #2563eb;
            --crimson: #ef4444;
            --crimson-dim: rgba(239, 68, 68, 0.1);
            --crimson-border: rgba(239, 68, 68, 0.25);
            --emerald: #10b981;
            --emerald-dim: rgba(16, 185, 129, 0.1);
            --emerald-border: rgba(16, 185, 129, 0.25);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--background);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-col: column;
            flex-direction: column;
            align-items: center;
            user-select: none;
            overflow-x: hidden;
            padding-bottom: 50px;
        }

        header {
            width: 100%;
            max-width: 1000px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .offline-badge {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 99px;
            color: var(--text-muted);
        }

        .study-mode-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--blue-light);
            margin-bottom: 2px;
        }

        h1 {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-w: 300px;
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 650px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .progress-container {
            width: 100%;
            margin-bottom: 30px;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin-bottom: 10px;
        }

        .progress-bar-bg {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 99px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            border-radius: 99px;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.5);
        }

        .progress-footer {
            font-family: monospace;
            font-size: 10px;
            color: rgba(142, 142, 159, 0.6);
            margin-top: 8px;
            text-align: right;
        }

        .card-perspective {
            width: 100%;
            aspect-ratio: 4/3;
            perspective: 1000px;
            cursor: pointer;
        }

        .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-inner.flipped {
            transform: rotateY(180deg);
        }

        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            border-radius: 28px;
            border: 1.5px solid var(--border);
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            transition: border-color 0.3s;
        }

        .card-perspective:hover .card-face {
            border-color: var(--border-hover);
        }

        .card-front {
            background: var(--card);
        }

        .card-back {
            background: var(--card);
            transform: rotateY(180deg);
        }

        .front-text {
            font-size: 24px;
            font-weight: 900;
            text-align: center;
            line-height: 1.3;
            letter-spacing: -0.02em;
            padding: 0 16px;
        }

        .back-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            padding: 16px 0;
        }

        .back-text-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            padding: 0 16px;
        }

        .back-text {
            font-size: 18px;
            font-weight: 500;
            text-align: center;
            line-height: 1.5;
            color: var(--blue-light);
            font-style: italic;
        }

        .tip-box {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 16px;
            border-radius: 16px;
            text-align: left;
            margin-top: 24px;
        }

        .tip-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            color: #d97706;
            margin-bottom: 6px;
        }

        .tip-text {
            font-size: 12px;
            line-height: 1.4;
            color: var(--text-muted);
            font-style: italic;
        }

        .tap-prompt {
            position: absolute;
            bottom: 32px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            opacity: 0.35;
        }

        .actions-container {
            margin-top: 40px;
            width: 100%;
            max-width: 380px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        button {
            border: none;
            outline: none;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
        }

        .primary-btn {
            width: 100%;
            height: 56px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            background: var(--text);
            color: var(--background);
        }

        .primary-btn:hover {
            opacity: 0.9;
        }

        .primary-btn:active {
            transform: scale(0.98);
        }

        .eval-buttons {
            display: none;
            align-items: center;
            gap: 16px;
        }

        .eval-buttons.active {
            display: flex;
        }

        .eval-btn {
            flex: 1;
            height: 56px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid transparent;
        }

        .dont-know-btn {
            border-color: var(--crimson-border);
            background: var(--crimson-dim);
            color: var(--crimson);
        }

        .dont-know-btn:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .dont-know-btn:active {
            transform: scale(0.98);
        }

        .got-it-btn {
            border-color: var(--emerald-border);
            background: var(--emerald-dim);
            color: var(--emerald);
        }

        .got-it-btn:hover {
            background: rgba(16, 185, 129, 0.2);
        }

        .got-it-btn:active {
            transform: scale(0.98);
        }

        .footer-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-top: 24px;
        }

        .nav-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 14px 20px;
            border-radius: 16px;
            color: var(--text);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--border-hover);
        }

        .nav-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }

        .counter-badge {
            background: var(--card);
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 140px;
        }

        .counter-badge-label {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--text-muted);
            margin-bottom: 2px;
        }

        .counter-badge-value {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: var(--blue-light);
        }

        /* End View styles */
        .verdict-container {
            display: none;
            width: 100%;
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 48px;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            animation: fadeIn 0.5s ease;
        }

        .verdict-icon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: var(--blue-dim);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 24px;
        }

        .verdict-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            color: var(--blue-light);
            margin-bottom: 8px;
        }

        .verdict-score {
            font-size: 72px;
            font-weight: 900;
            color: var(--text);
            line-height: 1;
            margin-bottom: 24px;
        }

        .verdict-remark {
            font-size: 14px;
            font-style: italic;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.7);
            max-width: 400px;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            <div>
                <p class="study-mode-label">Active Recall</p>
                <h1>${safeTitle}</h1>
            </div>
        </div>
        <div class="offline-badge">Offline Active</div>
    </header>

    <main id="study-view">
        <div class="progress-container">
            <div class="progress-header">
                <span>Sprint Progress</span>
                <span id="progress-text">0 / 0 Mastered</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="progress-bar"></div>
            </div>
            <div class="progress-footer" id="pointer-text">
                Card 1 of 1
            </div>
        </div>

        <div class="card-perspective" id="card-trigger">
            <div class="card-inner" id="card-inner">
                <div class="card-face card-front">
                    <p class="front-text" id="card-front-text">Front</p>
                    <span class="tap-prompt">Tap Card to Flip</span>
                </div>
                <div class="card-face card-back">
                    <div class="back-container">
                        <div class="back-text-wrapper">
                            <p class="back-text" id="card-back-text">Back</p>
                        </div>
                        <div class="tip-box">
                            <div class="tip-header">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                <span>Professor's Tip</span>
                            </div>
                            <p class="tip-text" id="card-tip-text">Tip text</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="actions-container">
            <button class="primary-btn" id="reveal-btn">Reveal Answer</button>
            <div class="eval-buttons" id="eval-box">
                <button class="eval-btn dont-know-btn" id="dont-know-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    Don't Know
                </button>
                <button class="eval-btn got-it-btn" id="got-it-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                    Got It
                </button>
            </div>

            <div class="footer-nav">
                <button class="nav-btn" id="prev-btn" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                    Prev
                </button>
                <div class="counter-badge">
                    <span class="counter-badge-label">Recall Deck</span>
                    <span class="counter-badge-value" id="counter-text">Card 1 / 1</span>
                </div>
                <button class="nav-btn" id="next-btn">
                    Next
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
        </div>
    </main>

    <main id="verdict-view" style="display: none;">
        <div class="verdict-container" id="verdict-container" style="display: flex;">
            <div class="verdict-icon">🎓</div>
            <div class="verdict-title">Session Complete</div>
            <div class="verdict-score" id="final-mastered">100%</div>
            <p class="verdict-remark">
                "You've reviewed all memory cards. High-yield recall loops complete."
            </p>
            <button class="primary-btn" style="margin-top: 32px;" onclick="window.location.reload();">Study Again</button>
        </div>
    </main>

    <script>
        const cards = ${JSON.stringify(flashcards)};

        let queue = Array.from({ length: cards.length }, (_, i) => i);
        let pointer = 0;
        let isFlipped = false;
        const mastered = new Set();

        const cardTrigger = document.getElementById('card-trigger');
        const cardInner = document.getElementById('card-inner');
        const cardFrontText = document.getElementById('card-front-text');
        const cardBackText = document.getElementById('card-back-text');
        const cardTipText = document.getElementById('card-tip-text');
        
        const revealBtn = document.getElementById('reveal-btn');
        const evalBox = document.getElementById('eval-box');
        const dontKnowBtn = document.getElementById('dont-know-btn');
        const gotItBtn = document.getElementById('got-it-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const counterText = document.getElementById('counter-text');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const pointerText = document.getElementById('pointer-text');

        const studyView = document.getElementById('study-view');
        const verdictView = document.getElementById('verdict-view');
        const finalMastered = document.getElementById('final-mastered');

        function updateUI() {
            if (pointer >= queue.length) {
                // Complete
                studyView.style.display = 'none';
                verdictView.style.display = 'flex';
                finalMastered.textContent = Math.round((mastered.size / cards.length) * 100) + '%';
                return;
            }

            const currentIdx = queue[pointer];
            const currentCard = cards[currentIdx];

            // Render text
            cardFrontText.textContent = currentCard.front || "";
            
            // Format back
            const backTextRaw = currentCard.back || "";
            const parts = backTextRaw.split("💡");
            const answer = parts[0].trim();
            const tip = parts[1] ? parts[1].replace(/Professor's Protocol:|Protocol:/i, "").trim() : "Focus on the core concept.";
            
            cardBackText.textContent = answer;
            cardTipText.textContent = tip;

            // Flipped status
            if (isFlipped) {
                cardInner.classList.add('flipped');
                revealBtn.style.display = 'none';
                evalBox.classList.add('active');
            } else {
                cardInner.classList.remove('flipped');
                revealBtn.style.display = 'block';
                evalBox.classList.remove('active');
            }

            // Stats
            const progress = Math.round((mastered.size / cards.length) * 100);
            progressBar.style.width = progress + '%';
            progressText.textContent = mastered.size + ' / ' + cards.length + ' Mastered';
            pointerText.textContent = 'Card ' + (pointer + 1) + ' of ' + queue.length + ' in round';
            counterText.textContent = 'Card ' + (pointer + 1) + ' / ' + queue.length;

            prevBtn.disabled = pointer === 0;
        }

        function toggleFlip() {
            isFlipped = !isFlipped;
            updateUI();
        }

        function evaluate(isMastered) {
            const currentIdx = queue[pointer];
            if (isMastered) {
                mastered.add(currentIdx);
            } else {
                queue.push(currentIdx);
            }

            isFlipped = false;
            pointer++;
            updateUI();
        }

        cardTrigger.addEventListener('click', toggleFlip);
        revealBtn.addEventListener('click', toggleFlip);
        dontKnowBtn.addEventListener('click', () => evaluate(false));
        gotItBtn.addEventListener('click', () => evaluate(true));
        
        prevBtn.addEventListener('click', () => {
            if (pointer > 0) {
                pointer--;
                isFlipped = false;
                updateUI();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (pointer < queue.length - 1) {
                pointer++;
                isFlipped = false;
                updateUI();
            } else {
                // Submit/Finish
                pointer = queue.length;
                updateUI();
            }
        });

        // Key Listeners
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleFlip();
            } else if (e.key.toLowerCase() === 'j') {
                if (isFlipped) evaluate(false);
            } else if (e.key.toLowerCase() === 'k') {
                if (isFlipped) evaluate(true);
            }
        });

        updateUI();
    </script>
</body>
</html>`;

    triggerDownload(`${safeTitle}_Flashcards.html`, html);
}

export function downloadQuizOffline(title: string, quizQuestions: any[], timerSeconds = 600) {
    const safeTitle = escapeHtml(title);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Offline Assessment</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #050508;
            --card: #0c0c16;
            --border: #1a1a2e;
            --border-hover: #2a2a4e;
            --blue: #2563eb;
            --blue-dim: rgba(37, 99, 235, 0.1);
            --blue-border: rgba(37, 99, 235, 0.25);
            --blue-light: #60a5fa;
            --text: #ffffff;
            --text-muted: #8e8e9f;
            --accent: #2563eb;
            --crimson: #ef4444;
            --crimson-dim: rgba(239, 68, 68, 0.1);
            --crimson-border: rgba(239, 68, 68, 0.25);
            --emerald: #10b981;
            --emerald-dim: rgba(16, 185, 129, 0.1);
            --emerald-border: rgba(16, 185, 129, 0.25);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--background);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            user-select: none;
            overflow-x: hidden;
            padding-bottom: 60px;
        }

        header {
            width: 100%;
            max-width: 1000px;
            height: 64px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        h2 {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
        }

        .timer-badge {
            padding: 6px 16px;
            border-radius: 12px;
            font-family: monospace;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.03);
        }

        .timer-badge.urgent {
            color: var(--crimson);
            border-color: var(--crimson-border);
            background: var(--crimson-dim);
            animation: pulse 1s infinite alternate;
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 768px;
            padding: 24px;
            margin-top: 24px;
        }

        .question-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 32px;
            overflow-x: auto;
            padding-bottom: 12px;
        }

        .question-pills::-webkit-scrollbar {
            display: none;
        }

        .pill {
            height: 32px;
            min-width: 32px;
            padding: 0 12px;
            border-radius: 99px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            background: transparent;
            color: rgba(255,255,255,0.3);
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
        }

        .pill:hover {
            background: rgba(255,255,255,0.05);
        }

        .pill.active {
            background: var(--text);
            color: var(--background);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }

        .pill.answered {
            border-color: rgba(255,255,255,0.2);
            color: var(--text);
        }

        .pill.flagged {
            border-color: var(--blue-border);
            color: var(--blue-light);
        }

        .question-card {
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .question-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .q-badge {
            background: var(--blue-dim);
            color: var(--blue-light);
            border: 1px solid var(--blue-border);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 4px 12px;
            border-radius: 99px;
        }

        .flag-btn {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.4);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .flag-btn.flagged {
            color: var(--blue-light);
        }

        .question-text {
            font-size: 20px;
            font-weight: 500;
            line-height: 1.5;
        }

        .options-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .option-btn {
            width: 100%;
            padding: 20px;
            text-align: left;
            font-size: 13px;
            font-weight: 700;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 20px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .option-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text);
        }

        .option-letter {
            width: 20px;
            height: 20px;
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 9px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
        }

        .option-btn.selected {
            background: var(--blue-dim);
            color: var(--blue-light);
            border-color: rgba(37, 99, 235, 0.5);
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.1);
            transform: scale(1.01);
        }

        .option-btn.selected .option-letter {
            background: var(--blue);
            color: white;
            border-color: var(--blue);
        }

        /* Review modes */
        .option-btn.correct {
            background: var(--emerald-dim) !important;
            border-color: rgba(16, 185, 129, 0.5) !important;
            color: var(--emerald) !important;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
            transform: scale(1.01);
        }

        .option-btn.incorrect {
            background: var(--crimson-dim) !important;
            border-color: rgba(239, 68, 68, 0.5) !important;
            color: var(--crimson) !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
            transform: scale(1.01);
        }

        .explanation-box {
            background: rgba(37, 99, 235, 0.05);
            border: 1px solid rgba(37, 99, 235, 0.1);
            padding: 24px;
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
        }

        .explanation-header {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--blue-light);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .explanation-text {
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255,255,255,0.7);
        }

        .nav-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 48px;
            padding-top: 32px;
            border-t: 1px solid rgba(255,255,255,0.05);
        }

        .nav-btn {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: 12px;
            color: var(--text);
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.2s;
        }

        .nav-btn:hover {
            background: rgba(255,255,255,0.08);
        }

        .nav-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }

        .submit-btn {
            background: var(--blue);
            color: white;
            border: none;
            box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
        }

        .next-btn {
            background: var(--text);
            color: var(--background);
        }

        /* Submit Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 50;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .modal-card {
            max-width: 380px;
            width: 100%;
            background: #0b0b14;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 40px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
        }

        .modal-icon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: var(--blue-dim);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 700;
        }

        .modal-desc {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            line-height: 1.4;
        }

        .modal-actions {
            width: 100%;
            display: flex;
            gap: 12px;
        }

        .modal-btn {
            flex: 1;
            padding: 16px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
        }

        .cancel-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.05);
            color: var(--text);
        }

        .confirm-btn {
            background: var(--blue);
            color: white;
            border: none;
        }

        /* Verdict styling */
        .verdict-card {
            border-radius: 40px;
            background: rgba(255,255,255,0.01);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            margin-bottom: 24px;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
            width: 100%;
            border-top: 1px solid rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding: 32px 0;
            margin: 32px 0;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 900;
        }

        .stat-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: rgba(255,255,255,0.4);
            margin-top: 4px;
        }

        .remark-text {
            font-size: 14px;
            font-style: italic;
            line-height: 1.6;
            color: rgba(255,255,255,0.6);
            padding: 0 24px;
        }

        @keyframes pulse {
            from { opacity: 0.8; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            <h2>${safeTitle}</h2>
        </div>
        <div class="timer-badge" id="timer">10:00</div>
    </header>

    <main id="quiz-view">
        <div class="question-pills" id="pills-container"></div>

        <div class="question-card">
            <div class="question-meta">
                <span class="q-badge" id="question-badge">Question 1 / 1</span>
                <button class="flag-btn" id="flag-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>
                    <span id="flag-text">Flag</span>
                </button>
            </div>

            <h3 class="question-text" id="question-text">Question Text</h3>

            <div class="options-grid" id="options-container"></div>

            <div class="explanation-box" id="explanation-container" style="display: none;">
                <div class="explanation-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    <span>Explanation</span>
                </div>
                <p class="explanation-text" id="explanation-text">Explanation text goes here...</p>
            </div>

            <div class="nav-footer">
                <button class="nav-btn" id="prev-btn" disabled>Prev</button>
                <button class="nav-btn next-btn" id="next-btn">Next</button>
            </div>
        </div>
    </main>

    <main id="verdict-view" style="display: none;">
        <div class="verdict-card">
            <div class="modal-icon">🎓</div>
            <div class="verdict-title">Academic Rank</div>
            <div class="verdict-score" style="font-size: 80px;" id="verdict-score-pct">0%</div>
            
            <div class="stat-grid">
                <div>
                    <div class="stat-value" id="stat-correct">0</div>
                    <div class="stat-label">Correct</div>
                </div>
                <div>
                    <div class="stat-value" id="stat-incorrect">0</div>
                    <div class="stat-label">Incorrect</div>
                </div>
                <div>
                    <div class="stat-value" style="color: var(--blue-light);" id="stat-accuracy">0%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
            </div>

            <p class="remark-text" id="remark-text">"Your grades have been consolidated by the Professor."</p>
        </div>

        <button class="primary-btn" id="review-btn">Review Answers</button>
        <button class="primary-btn" style="margin-top: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: white;" onclick="window.location.reload();">Retake Quiz</button>
    </main>

    <div class="modal-overlay" id="submit-modal">
        <div class="modal-card">
            <div class="modal-icon">📝</div>
            <div class="modal-title">Submit Assessment?</div>
            <div class="modal-desc">Your responses will be graded and reviewed.</div>
            <div class="modal-actions">
                <button class="modal-btn cancel-btn" id="cancel-submit">Cancel</button>
                <button class="modal-btn confirm-btn" id="confirm-submit">Submit</button>
            </div>
        </div>
    </div>

    <script>
        const questions = ${JSON.stringify(quizQuestions)};
        const initialTimer = ${timerSeconds};

        let currentIndex = 0;
        const answers = {};
        const flags = new Set();
        let status = 'taking'; // taking, verdict, review
        let timeLeft = initialTimer;
        let timerInterval;

        const timerBadge = document.getElementById('timer');
        const pillsContainer = document.getElementById('pills-container');
        
        const questionBadge = document.getElementById('question-badge');
        const flagBtn = document.getElementById('flag-btn');
        const flagText = document.getElementById('flag-text');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        const quizView = document.getElementById('quiz-view');
        const verdictView = document.getElementById('verdict-view');
        const submitModal = document.getElementById('submit-modal');
        const cancelSubmit = document.getElementById('cancel-submit');
        const confirmSubmitBtn = document.getElementById('confirm-submit');

        const verdictScorePct = document.getElementById('verdict-score-pct');
        const statCorrect = document.getElementById('stat-correct');
        const statIncorrect = document.getElementById('stat-incorrect');
        const statAccuracy = document.getElementById('stat-accuracy');
        const remarkText = document.getElementById('remark-text');
        const reviewBtn = document.getElementById('review-btn');
        
        const explanationContainer = document.getElementById('explanation-container');
        const explanationText = document.getElementById('explanation-text');

        function startTimer() {
            if (initialTimer === 0) {
                timerBadge.style.display = 'none';
                return;
            }
            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    submitAssessment();
                    return;
                }
                timeLeft--;
                updateTimerDisplay();
            }, 1000);
        }

        function updateTimerDisplay() {
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            timerBadge.textContent = m + ':' + s.toString().padStart(2, '0');
            if (timeLeft < 60) {
                timerBadge.classList.add('urgent');
            } else {
                timerBadge.classList.remove('urgent');
            }
        }

        function renderPills() {
            pillsContainer.innerHTML = '';
            questions.forEach((_, idx) => {
                const button = document.createElement('button');
                button.className = 'pill';
                button.textContent = idx + 1;
                
                if (idx === currentIndex) {
                    button.classList.add('active');
                } else if (answers[idx] !== undefined) {
                    button.classList.add('answered');
                } else if (flags.has(idx)) {
                    button.classList.add('flagged');
                }

                button.addEventListener('click', () => {
                    currentIndex = idx;
                    renderQuestion();
                });
                pillsContainer.appendChild(button);
            });
        }

        function handleSelect(optionIndex) {
            if (status === 'review') return;
            answers[currentIndex] = optionIndex;
            renderPills();
            renderQuestion();
        }

        function toggleFlag() {
            if (flags.has(currentIndex)) {
                flags.delete(currentIndex);
            } else {
                flags.add(currentIndex);
            }
            renderPills();
            renderQuestion();
        }

        function renderQuestion() {
            const q = questions[currentIndex];
            questionBadge.textContent = 'Question ' + (currentIndex + 1) + ' / ' + questions.length;
            
            if (flags.has(currentIndex)) {
                flagBtn.classList.add('flagged');
                flagText.textContent = 'Flagged';
            } else {
                flagBtn.classList.remove('flagged');
                flagText.textContent = 'Flag';
            }

            questionText.textContent = q.question;
            optionsContainer.innerHTML = '';
            
            q.options.forEach((opt, idx) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                
                const letter = document.createElement('div');
                letter.className = 'option-letter';
                letter.textContent = String.fromCharCode(65 + idx);
                button.appendChild(letter);

                const span = document.createElement('span');
                span.textContent = opt;
                button.appendChild(span);

                const isSelected = answers[currentIndex] === idx;
                const isCorrect = q.correctIndex === idx;

                if (status === 'review') {
                    if (isCorrect) {
                        button.classList.add('correct');
                    } else if (isSelected) {
                        button.classList.add('incorrect');
                    }
                } else {
                    if (isSelected) {
                        button.classList.add('selected');
                    }
                }

                button.addEventListener('click', () => handleSelect(idx));
                optionsContainer.appendChild(button);
            });

            // Explanation box in review mode
            if (status === 'review') {
                explanationContainer.style.display = 'flex';
                explanationText.textContent = q.explanation || "No explanation provided.";
            } else {
                explanationContainer.style.display = 'none';
            }

            // Footer navigation
            prevBtn.disabled = currentIndex === 0;
            if (currentIndex === questions.length - 1 && status !== 'review') {
                nextBtn.textContent = 'Finish Exam';
                nextBtn.className = 'nav-btn submit-btn';
            } else {
                nextBtn.textContent = 'Next';
                nextBtn.className = 'nav-btn next-btn';
            }
        }

        function submitAssessment() {
            clearInterval(timerInterval);
            status = 'verdict';
            submitModal.style.display = 'none';
            quizView.style.display = 'none';
            verdictView.style.display = 'block';

            let score = 0;
            questions.forEach((q, i) => {
                if (answers[i] === q.correctIndex) score++;
            });

            const pct = Math.round((score / questions.length) * 100);
            verdictScorePct.textContent = pct + '%';
            statCorrect.textContent = score;
            statIncorrect.textContent = questions.length - score;
            statAccuracy.textContent = pct + '%';

            // Generate customized remark
            let remark = "You finished the assessment offline.";
            if (pct === 100) {
                remark = "Absolute genius. You have fully mastered this material.";
            } else if (pct >= 80) {
                remark = "Solid run. You've locked in the high-yield parts.";
            } else if (pct >= 50) {
                remark = "A passing run. Make sure to review flagged cards.";
            } else {
                remark = "Review required. Re-read summary and retake when ready.";
            }
            remarkText.textContent = '"' + remark + '"';
        }

        // Action events
        flagBtn.addEventListener('click', toggleFlag);
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
                renderPills();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                renderQuestion();
                renderPills();
            } else if (status === 'taking') {
                submitModal.style.display = 'flex';
            }
        });

        cancelSubmit.addEventListener('click', () => {
            submitModal.style.display = 'none';
        });

        confirmSubmitBtn.addEventListener('click', submitAssessment);

        reviewBtn.addEventListener('click', () => {
            status = 'review';
            verdictView.style.display = 'none';
            quizView.style.display = 'block';
            currentIndex = 0;
            renderPills();
            renderQuestion();
        });

        startTimer();
        renderPills();
        renderQuestion();
    </script>
</body>
</html>`;

    triggerDownload(`${safeTitle}_Assessment.html`, html);
}

function triggerDownload(filename: string, text: string) {
    if (typeof window === "undefined") return;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
