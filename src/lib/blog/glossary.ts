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
  },
  {
    slug: "professor-recall-loop",
    term: "The Professor Recall Loop",
    definition: "A proprietary learning framework that optimizes retrieval strength through iterative, high-pressure knowledge extraction.",
    extendedDefinition: "The Professor Recall Loop is the engine inside our Strategic Study Lab. It works by: 1. Inputting raw academic material. 2. Generating high-fidelity retrieval challenges. 3. Forcing a response under timed conditions. 4. Instant logic-feedback. 5. Variable-interval repetition. It turns a 'Library Zombie' into a 'Strategic Master' by eliminating the illusion of competence.",
    faqs: [
      { question: "How is this different from standard flashcards?", answer: "Standard flashcards are often too simple. The Loop focuses on complex logic, derivation, and contextual application, mimicking the hardest questions in exams like the SAT or JAMB." }
    ],
    relatedTerms: ["active-recall", "spaced-repetition", "neural-revision-system"]
  },
  {
    slug: "neural-revision-system",
    term: "Neural Revision System",
    definition: "An AI-powered methodology that maps academic content to the brain's natural semantic architecture.",
    extendedDefinition: "Instead of linear reading, the Neural Revision System uses AI to identify 'hub concepts'—the 20% of information that supports the other 80%. It creates a web of interconnected knowledge, reducing the total volume of memorization required while increasing retrieval speed during high-pressure exams.",
    faqs: [
      { question: "Does this work for STEM subjects?", answer: "It is specifically optimized for STEM (Biology, Chemistry, Physics) where understanding the 'hub' concept is the key to solving complex derivation problems." }
    ],
    relatedTerms: ["professor-recall-loop", "cognitive-load"]
  },
  {
    slug: "jamb",
    term: "JAMB",
    definition: "The Joint Admissions and Matriculation Board (JAMB) is the Nigerian entrance examination board for tertiary-level institutions.",
    extendedDefinition: "Passing JAMB in 2026 requires more than just subject knowledge; it requires familiarity with the Computer Based Test (CBT) environment and high-speed retrieval. The Professor AI simulates the JAMB interface to eliminate 'interface anxiety' and focuses your revision on the most frequently tested topics in the UTME syllabus.",
    faqs: [
      { question: "How many subjects do I take in JAMB?", answer: "You take four subjects: Use of English (compulsory) and three others related to your intended course of study." },
      { question: "Can AI help me with JAMB English?", answer: "Yes, by generating practice comprehension passages and identifying patterns in Lexis and Structure questions." }
    ],
    relatedTerms: ["cbt", "ai-exam-prep"]
  },
  {
    slug: "waec",
    term: "WAEC",
    definition: "The West African Examinations Council (WAEC) is an examination board established by law to determine the examinations required in the public interest in English-speaking West African countries.",
    extendedDefinition: "The WASSCE (WAEC) is a high-stakes exam where the 'Theory' section is often the decider between an A and a C. Our Neural Revision System helps you structure your essay answers using the specific keywords and logic rubrics that WAEC examiners are trained to look for.",
    faqs: [
      { question: "Does WAEC use CBT?", answer: "WAEC is primarily paper-based for now, but digital tools are increasingly used for preparation and marking." }
    ],
    relatedTerms: ["ai-exam-prep", "neural-revision-system"]
  },
  {
    slug: "cbt",
    term: "CBT",
    definition: "Computer Based Testing (CBT) is an assessment format where candidates enter their responses via a computer interface rather than on paper.",
    extendedDefinition: "CBT is the standard for JAMB and many professional exams. The biggest hurdle for most students isn't the content—it's the clock and the screen. The Professor AI's 'Exam Sprint' mode is a high-fidelity CBT simulator that trains your brain to maintain logic under the digital pressure of 2026 standards.",
    faqs: [
      { question: "How do I get faster at CBT?", answer: "Consistent practice in a timed environment. The more your brain gets used to clicking and thinking in a digital UI, the lower your cognitive load becomes during the real exam." }
    ],
    relatedTerms: ["jamb", "ai-exam-prep", "cognitive-load"]
  }
];

