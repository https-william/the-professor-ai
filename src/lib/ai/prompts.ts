/**
 * prompts.ts — Expert system prompts for each generation feature.
 *
 * Each prompt is purpose-built for cognitive science best practices.
 * The goal is not to produce AI-looking output—it is to produce
 * outputs that genuinely help students learn and perform.
 */

// ─── Shared JSON enforcement suffix ───────────────────────────────────────────
const JSON_ONLY = `\n\nCRITICAL: Return ONLY valid JSON. No markdown fences, no prose, no commentary before or after. The first character of your response must be "{" and the last must be "}".`;

// ─── Flashcards ───────────────────────────────────────────────────────────────
export function buildFlashcardsPrompt(
    content: string,
    count: number,
    difficulty: string
): string {
    const difficultyInstruction: Record<string, string> = {
        easy: "Create basic recall questions. Test key definitions and core facts. Each answer should be 1-2 sentences. A student who read the material once should get most right.",
        medium: "Create conceptual questions that require understanding relationships between ideas. Avoid pure memorisation — ask students to explain why or how. Answers should be 2-3 sentences.",
        difficult: "Create application questions. Present a scenario or context and ask students to apply the concept. Include subtle distinctions. A student needs deep understanding to answer correctly.",
        nightmare: "Create expert-level trap cards. Surface-level readings produce wrong answers. Use negative phrasing (\"which of the following is NOT...\"), edge cases, exceptions to rules, and common misconceptions. The front should make students pause.",
    };

    return `You are a study materials architect trained in cognitive science and spaced repetition theory.

Your task: Generate exactly ${count} flashcards from the content below.

DIFFICULTY: ${difficulty.toUpperCase()}
${difficultyInstruction[difficulty] || difficultyInstruction.medium}

CONTENT:
${content}

FLASHCARD DESIGN RULES:
1. Front (question side): Must be a conceptual question, never a raw statement. Start with "What", "Why", "How", "Explain", "Compare", or "What is the difference between".
2. Back (answer side): 1-3 sentences maximum. Lead with the core insight. Never pad with extra context.
3. NO fill-in-the-blank fronts ("The mitochondria is the _____ of the cell").
4. Distribute coverage: do NOT front-load the first sections; sample the full content.
5. Mnemonic device: If a concept benefits from one, add it at the end of the back after "💡 Remember:".
6. Each card must be standalone — a student who only sees this one card should understand the Q&A.

Return JSON with this exact shape:${JSON_ONLY}
{
  "title": "A short, descriptive title for this card set (5-8 words)",
  "flashcards": [
    {
      "front": "Conceptual question here",
      "back": "Concise, insight-first answer. 💡 Remember: mnemonic if applicable.",
      "topic": "Sub-topic label (1-3 words)"
    }
  ]
}`;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export function buildQuizPrompt(
    content: string,
    count: number,
    difficulty: string
): string {
    const difficultyInstruction: Record<string, string> = {
        easy: "Basic recall. All correct answers are explicitly stated in the content. Distractors are clearly wrong to anyone who read it.",
        medium: "Conceptual understanding. Correct answers require connecting ideas. At least one distractor should be partly true but incomplete.",
        difficult: "Application and analysis. Questions present scenarios; students apply principles. All 4 options should look plausible to a student who half-understood.",
        nightmare: "Expert distinction level. Questions test the difference between concepts that are easy to confuse. Wrong answers are deliberately based on the most common student misconceptions. Never use 'all of the above' or 'none of the above'. Every option must be individually defendable by someone who skimmed.",
    };

    return `You are an exam writer at a world-class university. You specialize in assessments that accurately discriminate between students who truly understand versus those who merely memorized.

Your task: Generate exactly ${count} multiple-choice questions from the content below.

DIFFICULTY: ${difficulty.toUpperCase()}
${difficultyInstruction[difficulty] || difficultyInstruction.medium}

CONTENT:
${content}

QUESTION DESIGN RULES:
1. Exactly 4 options per question. One correct, three plausible wrong answers.
2. NEVER use "All of the above", "None of the above", or "Both A and C".
3. Vary question types: definition (20%), application (40%), comparison (20%), analysis (20%).
4. correctIndex: 0-based index of the correct option in the options array.
5. Shuffle correct answers — do not always place correct answer at index 0 or 1.
6. explanation: 1-2 sentences explaining WHY the correct answer is right and why the main distractor is wrong.
7. Cover the full breadth of the content — not just the introduction.

Return JSON with this exact shape:${JSON_ONLY}
{
  "title": "Quiz: [Topic] (5-7 words)",
  "questions": [
    {
      "question": "Full question text ending with a question mark?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 2,
      "explanation": "Option C is correct because... Option A is tempting because...",
      "topic": "Sub-topic being tested"
    }
  ]
}`;
}

// ─── Podcast ──────────────────────────────────────────────────────────────────
export function buildPodcastPrompt(content: string, style: string): string {
    const styleInstruction: Record<string, string> = {
        educational: "Professor A (Dr. Alex) is enthusiastic and uses vivid analogies. Professor B (Dr. Blake) is precise, occasionally skeptical, asks sharp follow-up questions. Tone: engaging lecture-style but conversational.",
        casual: "Two friends (Alex and Blake) who happen to be studying the same subject. Natural language, jokes are welcome, tangents are fine as long as they loop back. Tone: breezy, like a commute conversation.",
        debate: "Alex believes one interpretation; Blake challenges it. Both have valid points. They argue respectfully, conceding when the other makes a strong case. Tone: structured intellectual debate.",
    };

    return `You are scripting a university podcast episode.

STYLE: ${style.toUpperCase()}
${styleInstruction[style] || styleInstruction.educational}

CONTENT TO COVER:
${content}

PODCAST RULES:
1. Minimum 10 exchanges (20 total lines). Target a 6-8 minute episode.
2. Open with a hook — a surprising fact, a provocative question, or a real-world scenario.
3. Cover the material systematically but do NOT just list facts — have the hosts debate, question, and connect ideas.
4. Include at least one "student question" moment: a host says "A student asked me recently..." and addresses a common misconception.
5. Use real-world analogies that aren't in the source material — add genuine intellectual value.
6. End with a memorable takeaway: 1-2 sentences that crystallize the most important insight.
7. Speaker names must be exactly "Professor A" and "Professor B" (or "Alex" and "Blake" for casual). No other speaker names.
8. Each line of dialogue should be 2-5 sentences. Not single words, not paragraphs.

Return JSON with this exact shape:${JSON_ONLY}
{
  "title": "Episode title (compelling, 6-10 words)",
  "summary": "One sentence description of what this episode covers",
  "script": [
    { "speaker": "Professor A", "text": "Full spoken line here." },
    { "speaker": "Professor B", "text": "Response here." }
  ],
  "keyTakeaway": "The single most important thing a listener should remember."
}`;
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function buildSummaryPrompt(content: string, style: string): string {
    const styleInstruction: Record<string, string> = {
        concise: "Produce a tight, exam-focused summary. Use bullet hierarchies. Bold every key term on first use. No introductory filler — start with the most important concept. Students should be able to revise from this in 10 minutes.",
        detailed: "Produce a comprehensive study guide. Use H2 headings for major concepts, H3 for sub-concepts. Include context, mechanisms, and real-world applications. Aim for completeness over brevity.",
        study: "Produce a structured study guide with: (1) Key Concepts — bulleted explanations; (2) Key Terms — glossary format; (3) Common Exam Questions — 3-5 questions a professor would ask; (4) Memory Anchors — one memorable metaphor per major concept.",
    };

    return `You are a study coach with a track record of helping students go from failing to first class.

Your task: Summarize the following content for exam preparation.

STYLE: ${style.toUpperCase()}
${styleInstruction[style] || styleInstruction.concise}

CONTENT:
${content}

SUMMARY RULES:
1. Organize by CONCEPT, not by page or section order. Group related ideas.
2. Bold key terms on first use: **mitosis**.
3. If the material includes numbers, dates, formulas, or names — collect them in a "Key Facts" section at the end.
4. Do NOT start with "This document covers..." or any filler. Start with substance.
5. Use markdown formatting: ## for major sections, **bold** for key terms, - for bullets.
6. If there are common student misconceptions related to this content, add a "⚠️ Common Mistakes" callout.

Write the summary now in markdown format. Return plain markdown, not JSON.`;
}

// ─── Mind Map ─────────────────────────────────────────────────────────────────
export function buildMindMapPrompt(content: string): string {
    return `You are an expert at structuring knowledge into hierarchical mind maps that reveal the true architecture of a subject.

Your task: Analyze the content below and create a mind map structure with exactly this hierarchy:
- 1 root node (the central topic)
- 4-7 branch nodes (major concepts) connected to the root
- 2-5 leaf nodes per branch (specific details, examples, facts)

CONTENT:
${content}

MIND MAP RULES:
1. Root: The single most accurate name for the overall topic. Short (2-5 words).
2. Branches: Major conceptual categories, not headings or page sections.
3. Leaves: Specific, testable facts or sub-concepts under each branch.
4. Every node label must be concise: 2-6 words maximum.
5. Nodes must form a genuine tree — no cross-connections in the JSON.

Return JSON with this exact shape:${JSON_ONLY}
{
  "topic": "Central topic name",
  "branches": [
    {
      "label": "Branch concept",
      "color": "#F59E0B",
      "children": [
        { "label": "Specific detail or sub-concept" }
      ]
    }
  ]
}

Use this color palette for branches (cycle through as needed):
["#F59E0B", "#6366F1", "#10B981", "#EF4444", "#8B5CF6", "#3B82F6", "#F97316"]`;
}
