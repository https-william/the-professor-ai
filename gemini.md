# The Professor - Project Map (gemini.md)

## 1. Project Identity
- **Name:** The Professor
- **Type:** B2C EdTech SaaS
- **Stack:** React 18 (Vite), TypeScript, Tailwind CSS (Deep Space Theme), Supabase (Auth/DB/Realtime), Google Gemini API.
- **Phase:** Phase 6 (Optimization & Polish)
- **Aesthetic:** Deep Space Glassmorphism (bg-core #050505, translucent panels, amber/blue/purple accents).

## 2. Current Objectives (Phase 6)
Ref: `PHASE_6_PLAN.md`
1.  **Performance Engineering:** Bundle analysis, code splitting, image optimization, memoization.
2.  **PWA Maturity:** Service worker strategies, offline fallback, install prompt refinement.
3.  **SEO & Social Sharing:** Dynamic meta tags, Open Graph images, sitemap.
4.  **Accessibility & Mobile Polish:** Touch targets (44px), keyboard nav, screen reader support.
5.  **Security Hardening:** Input sanitization, rate limiting, content policy.
6.  **Pre-Flight:** Webhook verification, mobile Safari testing, iOS permissions.

## 3. Data Schema Map
Derived from `types.ts` and `services/supabase.ts`.

### Core Tables (Supabase)
- **profiles**: Stores `UserProfile`. Linked to Auth ID.
- **duels**: Stores `DuelState`. Multiplayer quizzes.
- **hubs**: Stores Hub rooms. Realtime collaboration.
- **hub_messages**: Chat messages for Hubs.
- **public_shares**: Shared content (Exams/Lectures).
- **payment_logs**: Transaction history.
- **system_logs**: Admin logs.
- **avatars** (Storage Bucket): User profile pictures.

### Critical Interfaces

#### QuizState
Manages the active exam session.
- `questions`: Array of `QuizQuestion`.
- `userAnswers`: Record<questionId, answer>.
- `flaggedQuestions`: IDs of flagged questions.
- `isSubmitted`: Boolean status.
- `score`: Current score.
- `startTime`, `timeRemaining`: Timer logic.
- `focusStrikes`: Anti-cheat/focus metric.
- `currentQuestionIndex`: Navigation state.

#### UserProfile
The central user identity.
- **Identity:** `alias`, `fullName`, `photoURL`, `socials`.
- **Preferences:** `defaultDifficulty`, `learningStyle`, `personality`, `theme` (Deep Space), `reducedMotion`.
- **Stats:** `credits`, `streak`, `xp`, `questionsAnswered`.
- **Subscription:** `subscriptionTier` (Fresher/Scholar/Excellentia), `role` (student/admin).

#### DuelState
Manages real-time multiplayer implementation.
- `id`, `code`: Identity.
- `hostId`: Creator.
- `participants`: Array of `DuelParticipant` (score, status).
- `status`: Lifecycle (`INITIALIZING` -> `WAITING` -> `ACTIVE` -> `COMPLETED` -> `SUDDEN_DEATH`).
- `quizConfig`: Settings for the generated quiz.
- `suddenDeathQuestion`: Tie-breaker logic.

## 4. Key Services
- **supabase.ts**: Auth, DB (Profiles, Duels, Hubs), Realtime Subscriptions, Edge Functions (Credits).
- **genai**: Google Gemini SDK integration (Drafting content).

## 5. Protocol Status
- **Protocol 0 (Ingestion):** COMPLETE.
- **Phase 1 (Blueprint):** NEXT.
