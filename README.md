
<div align="center">
  <img src="public/logo.svg" alt="The Professor Logo" width="120" height="120" />
  <h1>The Professor</h1>
  <p><strong>Transforming Material into Mastery.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Engine-Google%20Gemini%20Flash-orange?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Stack-React%20%7C%20Supabase-black?style=for-the-badge" />
  </p>

  <p align="center">
    The Professor is an AI-powered academic accelerator designed to ingest raw chaos (PDFs, PPTXs, Notes) and output crystallized knowledge (Exams, Feynman Lectures, Flashcards).
  </p>
</div>

---

## ⚡ Core Capabilities

### 🧠 Neural Ingestion Engine
Drag and drop your entire semester's worth of content.
- **Multi-Format Support:** PDF, DOCX, PPTX, TXT, ZIP, and Image OCR.
- **Context Awareness:** Generates quizzes and lectures based strictly on *your* material, minimizing hallucinations.

### 🎓 Interactive Learning Modes
1.  **Exam Mode:** 
    - Adaptive difficulty (Easy to **Nightmare**).
    - Detailed grading with "Professor's Verdict" feedback.
    - Focus tracking (detects tab switching).
2.  **The Lecture Hall:**
    - Uses the **Feynman Technique** to explain complex topics using analogies (Gaming, Sports, Pop Culture).
    - Text-to-Speech integration for auditory learning.
3.  **The Arena (Multiplayer):**
    - Wager XP against other students.
    - Real-time synchronous exams.
    - Sudden Death tie-breakers.

### 📡 The Hub (Collaboration)
- Real-time study rooms.
- Shared material workspace.
- Consensus-based session management.

### 🧬 Gamification & Progression
- **XP System:** Earn experience for every correct answer.
- **Ranks:** Progress from "Fresher" to "Academic Weapon".
- **Streaks:** Daily activity tracking to build discipline.

---

## 🛠️ Technical Architecture

**The Professor** is built on a high-performance, serverless stack.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Component-based UI with strict typing. |
| **Styling** | Tailwind CSS | Utility-first styling with custom "Deep Space" theme. |
| **AI Engine** | Google Gemini API | Powered by `gemini-3-flash-preview` for low latency. |
| **Database** | Supabase (PostgreSQL) | User profiles, Arena lobbies, and persistence. |
| **Realtime** | Firebase / PeerJS | Live signalling for The Hub and VoIP. |
| **Payments** | Paystack | Subscription management (Scholar/Excellentia tiers). |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API Key
- Supabase Project Keys

### Installation

1.  **Clone the Neural Link:**
    ```bash
    git clone https://github.com/your-username/the-professor.git
    cd the-professor
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_KEY=your_supabase_anon_key
    VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key
    ```

4.  **Ignite:**
    ```bash
    npm run dev
    ```

---

## 🔐 Security & Privacy

- **Client-Side Processing:** Document text extraction happens in the browser.
- **Ephemeral Context:** AI sessions are context-aware but stateless where possible.
- **Role-Based Access:** Admin terminals ("Dean's Office") are protected by hydra-hashing verification.

---

## 📦 Deployment

The application is optimized for Vercel or Netlify.

```bash
npm run build
```

The build artifact includes PWA manifest generation for installation on mobile devices.

---

<div align="center">
  <small>Built by Vexis Automations.</small>
</div>
