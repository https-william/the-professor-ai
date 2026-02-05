# Reference Notes & Technical Specs

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS.
- **AI Engine**: Google GenAI SDK (`@google/genai`).
- **Backend Services**: Supabase / Firebase (Auth, Database).

## AI Configuration Rules
1.  **API Key**: Must be accessed via `process.env.API_KEY` only. No user input for keys.
2.  **Models**:
    -   **Complex Reasoning/Quizzes**: `gemini-3-flash-preview` (Balanced for speed/intelligence).
    -   **Chat/Tutor**: `gemini-3-flash-preview`.
    -   **Strict Tasks**: Use `responseSchema` for JSON output (Quizzes, Study Protocols).
3.  **Fallback**: None. Rely on retries for API stability.

## UI/UX Principles
-   **Theme**: "Deep Space" (Dark Mode).
-   **Style**: Glassmorphism (Backdrop blur, translucent borders).
-   **Typography**: Inter (UI), Cinzel (Headings), JetBrains Mono (Data).
-   **Motion**: Smooth transitions (`framer-motion` style CSS animations).

## Data Structures
-   **Quiz**: JSON Array of `{ question, options, correct_answer, explanation }`.
-   **Professor Section**: `{ title, content, analogy, key_takeaway }`.
