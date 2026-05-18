export type PillarData = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content: {
    hero: { title: string; subtitle: string };
    sections: { title: string; body: string; list?: string[] }[];
    faqs?: { q: string; a: string }[];
    cta: { title: string; subtitle: string; label: string };
  };
};

export const pillars: Record<string, PillarData> = {
  "best-ai-for-math-revision": {
    slug: "best-ai-for-math-revision",
    title: "Best AI for Math | Step-by-Step Help",
    description: "Find the best AI tools to help with math. From basic algebra to complex calculus.",
    keywords: ["best ai for math", "math help ai", "solve math with ai"],
    content: {
      hero: { title: "Finally understand math", subtitle: "No more staring at blank pages. Get step-by-step help that actually makes sense." },
      sections: [
        { title: "Smart Solving", body: "Sometimes you just need someone to walk you through a problem. These tools don't just give answers — they show you how to get there.", list: ["Claude 3.5 for complex proofs", "WolframAlpha for quick math", "The Professor for study tips"] }
      ],
      cta: { title: "Ready to solve it?", subtitle: "Start working on your math problems with a bit of help.", label: "Start Solving" }
    }
  },
  "best-ai-for-exam-anxiety": {
    slug: "best-ai-for-exam-anxiety",
    title: "Best AI for Exam Stress | Staying Calm",
    description: "How to use AI to feel more prepared and less stressed before your big tests.",
    keywords: ["exam stress help", "how to stop exam anxiety", "study mental health"],
    content: {
      hero: { title: "Take a deep breath.", subtitle: "Being stressed is normal. We're here to help you feel ready so you can walk into that exam room with confidence." },
      sections: [
        { title: "Practice runs", body: "A lot of stress comes from not knowing what's coming. Use AI to run through practice questions until they feel like second nature." }
      ],
      cta: { title: "Feel more confident.", subtitle: "Join thousands of students who are staying calm this exam season.", label: "Build Confidence" }
    }
  },
  "best-ai-for-note-taking": {
    slug: "best-ai-for-note-taking",
    title: "Best AI for Note Taking | Smart Summaries",
    description: "The best AI tools to help you organize your lecture notes and stay on top of your classes.",
    keywords: ["best ai for note taking", "ai summarizer for students", "automated notes"],
    content: {
      hero: { title: "Notes that actually help", subtitle: "Don't just write things down to forget them. Turn your lectures into useful study guides." },
      sections: [
        { title: "Get the main points", body: "Use AI to find the most important parts of your lectures so you don't have to re-read everything.", list: ["Otter.ai for recording", "The Professor for the big ideas", "Notion for keeping it tidy"] }
      ],
      cta: { title: "Save some time.", subtitle: "Start organizing your notes the smart way.", label: "Start Now" }
    }
  },
  "best-ai-for-medical-students": {
    slug: "best-ai-for-medical-students",
    title: "Best AI for Medical Students (2026) | Anatomy, Path & USMLE",
    description: "Medical school is a volume game. Use AI to compress terminology and understand diagnosis logic.",
    keywords: ["ai for med med students", "best ai for anatomy", "usmle prep ai"],
    content: {
      hero: { title: "Medical Study via Neural Compression", subtitle: "Ace the volume of med school with AI-powered retrieval." },
      sections: [
        { title: "Terminology Sprints", body: "Use our Neural Revision System to map complex pathology to your existing mental models." }
      ],
      cta: { title: "Ace the Boards", subtitle: "Join med students worldwide using The Professor.", label: "Join the Med Lab" }
    }
  },
  "best-ai-study-tools": {
    slug: "best-ai-study-tools",
    title: "Top 10 Best AI Study Tools for 2026 | The Definitive List",
    description: "The only list you need for AI studying tools. Ranked by utility, logic accuracy, and recall speed.",
    keywords: ["best ai study tools", "top ai for students", "ai revision software"],
    content: {
      hero: { title: "The Student's Arsenal: Top AI Tools", subtitle: "Every tool you need to become an academic outlier in 2026." },
      sections: [
        { title: "The Core Four", body: "You don't need 100 tools. You need four that work together.", list: ["The Professor for Strategy", "Claude for Logic", "Perplexity for Research", "Anki for Persistence"] }
      ],
      cta: { title: "Build your stack.", subtitle: "Get the full elite toolkit inside the platform.", label: "Access Toolkit" }
    }
  },
  "ultimate-ai-study-guide": {
    slug: "ultimate-ai-study-guide",
    title: "The Ultimate AI Study Guide (2026) | Ace Every Subject",
    description: "A comprehensive roadmap for using AI to ace academics. From high school to post-grad.",
    keywords: ["ultimate ai study guide", "how to use ai for school", "ai learning roadmap"],
    content: {
      hero: { title: "The Smart Blueprint: AI Assistance", subtitle: "The 2026 smart roadmap for students using AI-native frameworks." },
      sections: [
        { title: "The Framework", body: "Stop using AI as a chatbot. Start using it as a cognitive exoskeleton." }
      ],
      cta: { title: "Download the Blueprint.", subtitle: "Join 50k+ students following the guide.", label: "Get Blueprint" }
    }
  },
  "ai-exam-prep-guide": {
    slug: "ai-exam-prep-guide",
    title: "AI Exam Prep Guide: How to Pass Any Test with AI",
    description: "The specific workflow for using AI to prepare for standardized tests and final exams.",
    keywords: ["ai exam prep", "how to pass exams with ai", "ai test prep guide"],
    content: {
      hero: { title: "Exam Success: The AI Workflow", subtitle: "A step-by-step smart strategy for the 30 days before your exam." },
      sections: [
        { title: "The 30-Day Sprint", body: "How to use AI to build a simulation-heavy revision schedule." }
      ],
      cta: { title: "Start the Sprint.", subtitle: "Automate your exam prep schedule now.", label: "Start Prep" }
    }
  },
  "how-to-study-with-ai": {
    slug: "how-to-study-with-ai",
    title: "How to Study with AI: The 2026 Smart Guide",
    description: "The definitive guide on using AI as a cognitive force multiplier, not a replacement for your brain.",
    keywords: ["how to study with ai", "ai study guide", "ai learning strategy"],
    content: {
      hero: { title: "AI is a Tool. Learn to Use It.", subtitle: "The 2026 guide to smart studying using large language models." },
      sections: [
        { title: "The Replacement Fallacy", body: "Don't ask AI to write your essay. Ask it to find the logical holes in your argument." }
      ],
      cta: { title: "Level Up Your Brain", subtitle: "Access the full guide on AI studying.", label: "Get the Guide" }
    }
  },
  "best-ai-for-students": {
    slug: "best-ai-for-students",
    title: "Best AI for Students in 2026 | Top Tools",
    description: "A simple list of the best AI tools for students. We cut through the hype to find what actually works.",
    keywords: ["best ai for students", "top ai for school", "ai tools for university"],
    content: {
      hero: { title: "The tools you actually need", subtitle: "There are thousands of AI tools out there. We found the ones that genuinely help you study better." },
      sections: [
        { title: "Our favorites", body: "The tools that make a real difference in how you learn and stay organized." }
      ],
      cta: { title: "Try it out.", subtitle: "Join the students who are studying smarter every day.", label: "Get Started" }
    }
  },
  "waec-2026-guide": {
    slug: "waec-2026-guide",
    title: "WAEC 2026 Guide | How to Ace Your Exams",
    description: "The simple guide for students in West Africa. Get ready for WAEC 2026 with smart tools.",
    keywords: ["waec 2026 guide", "how to pass waec", "waec prep"],
    content: {
      hero: { title: "WAEC 2026 is coming.", subtitle: "Don't wait until the last minute. Get your study plan ready and start practicing with past questions." },
      sections: [
        { title: "The easy way to study", body: "Focus on the topics that actually come up in the exam, rather than trying to read the whole syllabus." }
      ],
      cta: { title: "Ready for WAEC?", subtitle: "Get everything you need to pass your exams.", label: "Get Started" }
    }
  },
  "jamb-2026-guide": {
    slug: "jamb-2026-guide",
    title: "JAMB 2026 Tips | Get a 300+ Score",
    description: "Everything you need to know to pass the JAMB UTME in 2026 with confidence.",
    keywords: ["jamb 2026 tips", "jamb 300+ guide", "ai for jamb"],
    content: {
      hero: { title: "Get ready for JAMB", subtitle: "We help you practice with real CBT questions so you can walk in feeling prepared." },
      sections: [
        { title: "Real practice", body: "Don't just read books. Practice with the same kind of questions you'll see on the big day." }
      ],
      cta: { title: "Ready for JAMB?", subtitle: "Start practicing today and see how you do.", label: "Start Now" }
    }
  },
  "neco-2026-guide": {
    slug: "neco-2026-guide",
    title: "NECO 2026 Guide | Smart Revision for SS3 Students",
    description: "Pass your NECO exams with ease using AI-powered study schedules and summaries.",
    keywords: ["neco 2026 guide", "ai for neco exam", "neco prep"],
    content: {
      hero: { title: "NECO 2026: Smart Revision", subtitle: "Simplifying the NECO syllabus through AI distillation." },
      sections: [
        { title: "SS3 Revision", body: "The final stretch. Use AI to patch knowledge gaps in under 14 days." }
      ],
      cta: { title: "Pass NECO.", subtitle: "Get the revision pack now.", label: "Get NECO Pack" }
    }
  },
  "sat-2026-guide": {
    slug: "sat-2026-guide",
    title: "Digital SAT 2026 Strategy | Target 1550+ with AI",
    description: "The digital SAT is a logic test. Use AI to learn the patterns and ace the score.",
    keywords: ["sat 2026 strategy", "digital sat ai", "sat 1550 guide"],
    content: {
      hero: { title: "Digital SAT: Pattern Study", subtitle: "Targeting a 1550+ by learning the logic patterns of the College Board." },
      sections: [
        { title: "The Logic Engine", body: "Mastering the reading and math sections through high-fidelity AI simulations." }
      ],
      cta: { title: "Score 1550+.", subtitle: "Join the elite SAT lab.", label: "Start SAT Prep" }
    }
  },
  "gcse-2026-guide": {
    slug: "gcse-2026-guide",
    title: "GCSE 2026 Guide | How to Get Grade 9s with AI",
    description: "UK students: Use AI to understand the GCSE syllabus. Active recall and spaced repetition for all subjects.",
    keywords: ["gcse 2026 guide", "grade 9 gcse ai", "gcse revision tips"],
    content: {
      hero: { title: "GCSE 2026: The Grade 9 Roadmap", subtitle: "Smart revision for UK students aiming for academic excellence." },
      sections: [
        { title: "Syllabus Compression", body: "Mapping the AQA/OCR/Edexcel syllabuses to AI retrieval loops." }
      ],
      cta: { title: "Get Grade 9s.", subtitle: "Start your GCSE study now.", label: "Join the GCSE Lab" }
    }
  },
  "a-levels-2026-guide": {
    slug: "a-levels-2026-guide",
    title: "A-Levels 2026 | Making the hard stuff simple",
    description: "A-Levels are tough, we know. Use AI to help break down complex topics and get your revision on track.",
    keywords: ["a levels 2026 help", "ai for a levels", "a level revision"],
    content: {
      hero: { title: "A-Levels don't have to be a nightmare", subtitle: "We help you break down the big concepts into things that actually make sense." },
      sections: [
        { title: "Break it down", body: "Sometimes you just need a simpler way to look at a hard topic. That's what we're here for." }
      ],
      cta: { title: "Need a hand?", subtitle: "Get some help with your A-Level revision today.", label: "Get Started" }
    }
  },
  "college-prep-with-ai": {
    slug: "college-prep-with-ai",
    title: "College Prep with AI (2026) | Admissions & Academic Readiness",
    description: "How to use AI to build a competitive college profile and prepare for university rigor.",
    keywords: ["college prep ai", "university admissions ai", "academic readiness"],
    content: {
      hero: { title: "College Readiness: The AI Advantage", subtitle: "Building a world-class academic profile using smart AI tools." },
      sections: [
        { title: "The Admission Loop", body: "Using AI to refine your academic narrative and prepare for the university transition." }
      ],
      cta: { title: "Get Into College.", subtitle: "Start your admissions journey.", label: "Start College Prep" }
    }
  },
  "university-revision-tips": {
    slug: "university-revision-tips",
    title: "University Revision | Get through your finals",
    description: "How to pass your uni exams without the burnout. Simple, smart revision tips for busy students.",
    keywords: ["university revision tips", "how to pass finals", "uni revision tips"],
    content: {
      hero: { title: "Uni finals are a lot.", subtitle: "We're here to help you get through your exams without losing your mind." },
      sections: [
        { title: "Get focused", body: "Use AI to pull out the most important info from your lectures so you can study what actually matters." }
      ],
      cta: { title: "Ready to pass?", subtitle: "Start revising the smart way today.", label: "Start Now" }
    }
  },
  "best-ai-for-debate-topics": {
    slug: "best-ai-for-debate-topics",
    title: "Best AI for Debating (2026) | Logical Fallacies & Rhetoric",
    description: "Use AI to build bulletproof arguments. Identify logical fallacies and master the art of rhetoric for debate tournaments.",
    keywords: ["ai for debate", "best ai for arguments", "debate topic generator ai"],
    content: {
      hero: { title: "Bulletproof Arguments: AI for Debate", subtitle: "Using large language models to stress-test your logic and refine your rhetoric." },
      sections: [
        { title: "The Counter-Argument Engine", body: "Don't just write your point. Ask the AI to play devil's advocate and tear your logic apart before your opponent does." },
        { title: "Fallacy Detection", body: "Train your AI to scan your opening statements for ad hominem, straw man, and slippery slope fallacies." }
      ],
      faqs: [
        { q: "Can AI help me win a debate?", a: "Yes, by providing diverse perspectives and identifying weaknesses in your logic that you might have missed." },
        { q: "What is the best AI for debate prep?", a: "Claude 3.5 Sonnet is currently the gold standard for logical consistency and nuanced argumentation." }
      ],
      cta: { title: "Win the debate.", subtitle: "Join the debate lab and start winning.", label: "Start Prep" }
    }
  },
  "how-to-study-with-active-recall-ai": {
    slug: "how-to-study-with-active-recall-ai",
    title: "Active Recall | The best way to remember",
    description: "Find out why testing yourself is the best way to study and how to do it without the stress.",
    keywords: ["active recall help", "how to study better", "remember what you study"],
    content: {
      hero: { title: "Stop just reading. Start remembering.", subtitle: "Reading notes over and over doesn't work. Testing yourself does. We make it easy." },
      sections: [
        { title: "Testing yourself", body: "Your brain remembers things better when it has to work for them. We give you quick quizzes to help you learn faster." }
      ],
      faqs: [
        { q: "Is this better than re-reading?", a: "Definitely. Research shows that testing yourself is way more effective than just looking at your notes again." },
        { q: "How often should I do this?", a: "Whenever you have 5 minutes. Consistency is better than cramming." }
      ],
      cta: { title: "Give it a try.", subtitle: "Start testing yourself today and see the difference.", label: "Start Now" }
    }
  },
  "ai-in-education-pros-and-cons": {
    slug: "ai-in-education-pros-and-cons",
    title: "AI in Education: The 2026 Debate | Pros, Cons & Future",
    description: "Is AI destroying education or evolving it? A balanced look at the pros and cons of AI in the classroom.",
    keywords: ["ai in education pros and cons", "is ai bad for students", "future of ai in school"],
    content: {
      hero: { title: "The AI Education Debate: 2026", subtitle: "Navigating the ethical and practical implications of AI-native learning." },
      sections: [
        { title: "The Pros: Hyper-Personalization", body: "AI provides 1-on-1 tutoring at zero marginal cost, democratizing elite education." },
        { title: "The Cons: Cognitive Atrophy", body: "If students use AI to skip the 'struggle' of learning, they lose the ability to think critically." }
      ],
      faqs: [
        { q: "Is AI replacing teachers?", a: "No, but it is replacing the 'lecturer' role. Teachers are evolving into 'academic coaches' and facilitators." },
        { q: "Is using AI cheating?", a: "Using it to generate answers is cheating; using it to explain concepts and test your knowledge is the best way to study." }
      ],
      cta: { title: "Join the conversation.", subtitle: "Learn how to use AI in a way that actually helps you learn.", label: "Join the community" }
    }
  },
  "how-to-summarize-academic-papers-ai": {
    slug: "how-to-summarize-academic-papers-ai",
    title: "How to read academic papers fast with AI",
    description: "Don't get bogged down in long research papers. Use AI to get the main points in minutes.",
    keywords: ["summarize academic papers", "ai for research", "read research papers fast"],
    content: {
      hero: { title: "Research made easy", subtitle: "Get the main points from long papers without the headache." },
      sections: [
        { title: "Quick scans", body: "Use AI to find the most important findings and methods in seconds." }
      ],
      faqs: [
        { q: "Can AI summarize complex papers?", a: "Yes, it's great at pulling out the core info from long documents." },
        { q: "Is it accurate?", a: "It's a great starting point to help you understand the big picture before you dive deep." }
      ],
      cta: { title: "Start reading.", subtitle: "Get through your reading list in half the time.", label: "Start Now" }
    }
  }
};
