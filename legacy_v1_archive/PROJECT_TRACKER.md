
# Project Tracker: The Professor (ExamPrep Agent)

## 1. Project Overview
"The Professor" is an AI-powered academic accelerator designed to transform raw study materials (PDFs, text) into interactive exams, lectures, and study guides.

**Core Philosophy:** "Transforming material into mastery."
**Aesthetics:** Premium "Deep Space" meets "Clean Glass" (Cluely-inspired UI, Floating Docks, Depth Buttons).

---

## 2. Technical Architecture

### Frontend
*   **Framework:** React 18 (via ESM imports).
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS + Custom Semantic CSS Variables.
*   **Navigation:** Floating Dock (macOS style).

### AI Engine
*   **Provider:** Google Gemini API (`@google/genai` SDK).
*   **Model:** `gemini-3-flash-preview`.
*   **TTS Engine:** Planned migration to **Piper** (Currently Gemini TTS).

### Backend Services (Serverless)
*   **Supabase:** Auth, Database (Profiles, Duels, Hubs).
*   **PeerJS (Planned):** WebRTC Signaling for VoIP.

---

## 3. Implementation Log

### Phase 1: Core Intelligence (Completed)
*   [x] Document Ingestion (PDF/DOCX/PPTX).
*   [x] Exam Mode (Quizzes, Timer, Scoring).
*   [x] Professor Mode (Feynman Lectures).
*   [x] Flashcards.

### Phase 2: UI & Theming (Completed)
*   [x] "Deep Space" Dark Mode.
*   [x] **UI Overhaul (Cluely Aesthetic):**
    *   Implemented "Depth Buttons" (Tactile shadows).
    *   Floating Command Dock for navigation.
    *   Consolidated Header (Clean Identity & Profile).
    *   "Ominous" Oracle Button styling.
*   [x] **Exam Review System:**
    *   Detailed post-exam analysis.
    *   Green/Red glow indicators for correct/wrong answers.
    *   Professor's explanations displayed inline.

### Phase 3: Social & Gamification (Active)
*   [x] **The Arena (Duels):** Multiplayer quizzes.
*   [x] **The Hub:**
    *   Real-time chat.
    *   Exit/Disconnect functionality added.
    *   "Consensus" mechanisms.
*   [x] **Leveling System:** Fixed progression formula (Sqrt curve).

### Phase 4: VoIP & Real-time (Next Up)
*   [ ] **Voice/Video Calls:** Peer-to-Peer implementation.
*   [ ] **Piper TTS:** Integration of high-quality local/hosted TTS.

---

## 4. Known Issues / Constraints
*   **Piper TTS**: Requires a backend endpoint or WASM implementation (Client-side Gemini TTS currently active).
*   **VoIP**: Currently simulated in The Hub; requires WebRTC implementation.

---

## 5. Deployment
*   Hosted on Vercel/Netlify (Static).
*   Environment Variables managed via `process.env`.
