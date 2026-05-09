export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  extendedDefinition: string;
  faqs: { question: string; answer: string }[];
  relatedTerms: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: "active-recall",
    term: "Active Recall",
    definition: "Active recall is a learning strategy that involves moving information from short-term to long-term memory by challenging the brain to retrieve it without looking at the source material.",
    extendedDefinition: "Active recall is based on the 'Testing Effect'. Instead of passively reading a textbook, you force your brain to generate an answer. This process strengthens the neural pathways associated with that information. In The Professor AI, this is implemented through high-fidelity exam simulations that mimic the pressure of a real test environment.",
    faqs: [
      { question: "Is active recall better than re-reading?", answer: "Yes, research consistently shows that active recall leads to significantly higher retention rates than passive re-reading or highlighting." },
      { question: "How often should I do active recall?", answer: "Ideally, you should combine it with Spaced Repetition, reviewing the material just before you are about to forget it." }
    ],
    relatedTerms: ["spaced-repetition", "cognitive-load", "testing-effect"]
  },
  {
    slug: "spaced-repetition",
    term: "Spaced Repetition",
    definition: "Spaced repetition is an evidence-based learning technique that involves increasing the intervals of time between subsequent reviews of previously learned material.",
    extendedDefinition: "Spaced repetition leverages the 'Forgetting Curve'. By reviewing information at specific intervals (e.g., 1 day, 7 days, 30 days), you reset the curve and move the information deeper into long-term storage. The Professor AI automates this scheduling so you spend zero time planning and 100% of your time mastering.",
    faqs: [
      { question: "What is the forgetting curve?", answer: "The forgetting curve is a mathematical formula that describes the rate at which information is forgotten after it is initially learned." },
      { question: "How does AI help with spaced repetition?", answer: "AI can dynamically adjust your review schedule based on how difficult you found a specific question, ensuring you focus on your weakest areas." }
    ],
    relatedTerms: ["active-recall", "forgetting-curve"]
  },
  {
    slug: "ai-exam-prep",
    term: "AI Exam Prep",
    definition: "AI exam prep refers to the use of artificial intelligence to generate practice questions, summarize dense notes, and simulate the exact conditions of a standardized test.",
    extendedDefinition: "Traditional exam prep is static—you buy a book and read it. AI exam prep is dynamic. It identifies your specific blind spots and generates custom challenges to fix them. For regional exams like JAMB and WAEC, this means practicing in a simulated CBT (Computer Based Test) environment that uses AI to grade your logic in real-time.",
    faqs: [
      { question: "Is AI exam prep allowed?", answer: "Yes, using AI as a study partner to generate practice materials is a legitimate and highly effective study method." },
      { question: "Can AI predict exam questions?", answer: "While it cannot see the actual future exam, AI can analyze past questions and syllabi to identify high-probability topics and patterns." }
    ],
    relatedTerms: ["jamb", "waec", "cbt"]
  },
  {
    slug: "cognitive-load",
    term: "Cognitive Load",
    definition: "Cognitive load refers to the total amount of mental effort being used in the working memory.",
    extendedDefinition: "When you study, you want to minimize 'extraneous load' (distractions, bad formatting) and maximize 'germane load' (the actual processing of concepts). The Professor AI reduces cognitive load by handling the organization and creation of study materials, allowing your brain to focus entirely on learning.",
    faqs: [
      { question: "How can I reduce cognitive load while studying?", answer: "Break complex topics into smaller 'chunks', remove digital distractions, and use tools that automate the mechanical parts of studying." }
    ],
    relatedTerms: ["active-recall", "chunking"]
  }
];
