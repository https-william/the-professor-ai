/**
 * Blog Posts — Static content store for SEO-optimized articles.
 * Each post is fully self-contained with metadata for SEO and rendering.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  author: string;
  date: string; // ISO date
  readTime: string;
  category: string;
  tags: string[];
  coverGradient: string; // CSS gradient for the card header
  icon: string; // Material Symbols icon name
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "active-recall-study-technique",
    title: "Active Recall: The Study Technique That Actually Works",
    excerpt: "Forget re-reading your notes. Science says there's a better way to lock knowledge into long-term memory — and it's not what your high school teacher taught you.",
    content: `
## The Problem With Passive Studying

Let's be honest: most of us "study" by re-reading our notes, highlighting everything in yellow, and hoping osmosis kicks in. Spoiler alert — it doesn't. Research consistently shows that **passive review** is one of the least effective ways to retain information.

## What Is Active Recall?

**Active recall** is the practice of actively stimulating your memory during the learning process. Instead of passively reading through material, you close your notes and try to recall the information from memory.

Think of your brain like a muscle. Reading notes is like watching someone else lift weights. Active recall is you actually picking up the barbell. The struggle is where the growth happens.

## The Science Behind It

A landmark study by Karpicke & Blunt (2011) found that students who practiced retrieval (active recall) retained **50% more information** after one week compared to students who used concept mapping — which was already considered an "active" technique.

The mechanism is elegant: every time you successfully retrieve a piece of information, you strengthen the neural pathway to that memory. The harder the retrieval, the stronger the encoding.

## How to Practice Active Recall

### 1. The Blank Page Method
After reading a chapter, close the book. Take a blank page and write everything you remember. Then go back and check what you missed.

### 2. Flashcards (Done Right)
Don't just flip and read. Look at the question side, genuinely try to answer it before flipping. The struggle to remember is the entire point.

### 3. Practice Questions
The Professor's quiz generator creates practice exams from your own material — which is active recall on autopilot.

### 4. Teach It Back
Try explaining the concept to someone (or even to yourself out loud). If you can't explain it simply, you don't understand it deeply enough.

## The Spacing Effect

Active recall works even better when combined with **spaced repetition** — reviewing material at increasing intervals. Day 1, Day 3, Day 7, Day 14. Each retrieval attempt at a wider interval locks the memory deeper.

## The Bottom Line

Stop re-reading. Start recalling. Your future exam-taking self will thank you.
    `,
    author: "The Professor",
    date: "2026-03-15",
    readTime: "6 min read",
    category: "Study Techniques",
    tags: ["active recall", "memory", "study tips", "science of learning"],
    coverGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    icon: "Brain",
    featured: true,
  },
  {
    slug: "ai-powered-study-tools-2026",
    title: "AI-Powered Study Tools in 2026: What's Real and What's Hype",
    excerpt: "AI study assistants are everywhere. But do they actually help you learn, or just help you avoid learning? A Professor's honest take.",
    content: `
## The AI Study Tool Explosion

It seems like every week there's a new AI app promising to "revolutionize" the way you study. AI flashcard generators, AI quiz makers, AI summarizers, AI tutors. The landscape is overwhelming — and honestly, not all of it is good.

## What AI Does Well

### Synthesis at Scale
AI excels at processing large volumes of text and extracting key concepts. If you have a 200-page textbook chapter, an AI can identify the core themes, key definitions, and important relationships faster than you can finish your coffee.

### Personalized Practice
The best AI study tools generate practice questions from **your specific material**, not generic question banks. This means you're being tested on exactly what you need to know.

### Instant Feedback
Traditional studying has a feedback gap. You read, you hope you understood, and you find out weeks later on the exam. AI can close that loop instantly — generating questions, evaluating your answers, and pointing out gaps in real-time.

## What AI Does Poorly

### Replacing Understanding
Here's the trap: if you use AI to generate a summary and then just read it, you've replaced one form of passive studying with another. The tool did the thinking, not you.

### False Confidence
Getting an AI to explain something perfectly can make you feel like *you* understand it. This is the **fluency illusion** — the content feels familiar because you just read a clean explanation, but you haven't actually encoded it in memory.

## The Right Way to Use AI for Studying

1. **Generate, don't consume**: Use AI to create study materials (flashcards, quizzes), then actively engage with them.
2. **Test yourself first**: Try to solve problems before asking AI for help. The struggle is where learning happens.
3. **Use it as a sparring partner**: Platforms like The Professor use AI as a Socratic tutor — asking you questions instead of just giving you answers.
4. **Verify and question**: AI can be wrong. Treat its outputs as a starting point, not gospel.

## The Bottom Line

AI study tools are powerful when they make you **do more cognitive work**, not less. The best AI tutor is the one that refuses to just give you the answer.
    `,
    author: "The Professor",
    date: "2026-03-28",
    readTime: "5 min read",
    category: "EdTech",
    tags: ["AI", "study tools", "education technology", "learning"],
    coverGradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
    icon: "Bot",
  },
  {
    slug: "spaced-repetition-explained",
    title: "Spaced Repetition: Your Brain's Cheat Code for Long-Term Memory",
    excerpt: "Why cramming fails and spacing works. The science-backed technique that turns short-term panic into long-term knowledge.",
    content: `
## Why Cramming Doesn't Work

We've all done it. The night before the exam, surrounded by energy drinks and desperation. You cram everything in, take the test, and promptly forget 90% of it. This isn't a personal failing — it's how human memory works.

**Cramming creates temporary familiarity, not lasting knowledge.**

## Enter Spaced Repetition

Spaced repetition is a learning technique based on the **forgetting curve** — a concept discovered by Hermann Ebbinghaus in 1885. His research showed that memory decays exponentially over time, but each review resets and flattens the curve.

The key insight: **review material just as you're about to forget it**. Not too early (wasted effort) and not too late (you've already forgotten). The sweet spot is where the magic happens.

## The Algorithm

Modern spaced repetition systems (SRS) use algorithms to calculate optimal review intervals:

| Review # | Interval |
|----------|----------|
| 1st review | 1 day |
| 2nd review | 3 days |
| 3rd review | 7 days |
| 4th review | 14 days |
| 5th review | 30 days |

If you get a card wrong, it resets to a shorter interval. If you get it right easily, the interval expands. The system adapts to how well you actually know each piece of information.

## Why It Works

Three mechanisms make spaced repetition so effective:

1. **Desirable difficulty**: The slight struggle of retrieval at wider intervals strengthens encoding.
2. **Interleaving**: Spacing naturally mixes old and new material, which improves discrimination between similar concepts.
3. **Metacognition**: The process forces you to confront what you actually know vs. what you think you know.

## How to Start

1. **Choose your tool**: The Professor's flashcard system has built-in spacing. Or use any SRS tool.
2. **Make cards as you learn**: Don't wait until the end. Create flashcards during your first reading.
3. **Keep cards atomic**: One concept per card. "What are the 7 characteristics of living organisms?" is a bad card. "What is homeostasis?" is a good card.
4. **Trust the schedule**: Review when the system tells you to, even if it feels too soon or too late.

## The Compound Effect

The beautiful thing about spaced repetition is that it compounds. After a few weeks, you're reviewing hundreds of cards in minutes, because most of them are at long intervals. The initial investment pays exponential dividends.

Start today. Your exam-month self will feel like a genius.
    `,
    author: "The Professor",
    date: "2026-04-01",
    readTime: "7 min read",
    category: "Study Techniques",
    tags: ["spaced repetition", "memory", "flashcards", "Ebbinghaus"],
    coverGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    icon: "Calendar",
    featured: true,
  },
  {
    slug: "how-to-read-academic-papers",
    title: "How to Read an Academic Paper Without Losing Your Mind",
    excerpt: "Academic papers weren't written for pleasure. Here's the Professor's battle-tested strategy for extracting value without reading every word.",
    content: `
## The Honest Truth

Academic papers are dense, jargon-heavy, and often deliberately impenetrable. They're not designed to be read cover-to-cover like a novel. If you're trying to do that, stop. There's a better way.

## The Three-Pass Method

### Pass 1: The Reconnaissance (5 minutes)
- Read the **title**, **abstract**, and **conclusion**
- Look at the **figures and tables** — these often tell the entire story
- Read the **section headings** to understand the structure
- Ask yourself: "Is this paper relevant to what I'm studying?"

### Pass 2: The Survey (20 minutes)
- Read the **introduction** carefully — this gives you the context and research question
- Skim each section, focusing on the **first and last sentence** of each paragraph
- Pay attention to **bold claims**, **statistics**, and **comparisons**
- Don't try to understand the methodology in detail yet

### Pass 3: The Deep Dive (as needed)
- Only do this for papers that are directly relevant to your work
- Now read the methodology section
- Try to **reconstruct the logic**: What did they do? Why? What did they find?
- Take notes in your own words — this is active recall in disguise

## Red Flags to Watch For

- **Small sample sizes** without acknowledgment
- **Correlation presented as causation**
- **Cherry-picked citations** (only citing supporting evidence)
- **Vague methodology** ("participants were surveyed" — about what? How?)

## Pro Tips

1. **Read the references**: A paper's bibliography is a treasure map to related work.
2. **Look for review papers first**: These synthesize multiple studies and save you enormous time.
3. **Use The Professor to summarize**: Upload the paper and let AI extract the key findings. Then verify with your own reading.
4. **Discussion sections are gold**: This is where authors speculate, acknowledge limitations, and suggest future directions. It's often the most interesting part.

## The Bottom Line

You don't need to read every paper thoroughly. You need to read the right papers in the right way. Master the three-pass method, and you'll process academic literature like a seasoned researcher.
    `,
    author: "The Professor",
    date: "2026-04-05",
    readTime: "5 min read",
    category: "Academic Skills",
    tags: ["academic papers", "reading strategies", "research", "study skills"],
    coverGradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    icon: "FileText",
  },
  {
    slug: "feynman-technique-guide",
    title: "The Feynman Technique: Teach It to Learn It",
    excerpt: "Named after Nobel laureate Richard Feynman, this technique exposes the gaps in your understanding by making you explain things simply.",
    content: `
## Who Was Feynman?

Richard Feynman was a Nobel Prize-winning physicist known for his ability to explain incredibly complex ideas in simple, intuitive terms. He believed that if you couldn't explain something to a first-year student, you didn't really understand it.

That belief became a learning technique. And it's one of the most powerful in existence.

## The Four Steps

### Step 1: Choose a Concept
Pick something you're trying to learn. "Photosynthesis," "Supply and Demand," "Neural Networks" — anything.

### Step 2: Teach It to a Child
Write an explanation as if you're teaching it to a 12-year-old. Use simple language. No jargon. No hand-waving. If you catch yourself saying "it's basically like..." — that's fine. Analogies are your friend.

### Step 3: Identify the Gaps
This is where the magic happens. As you try to explain simply, you'll hit points where you get stuck. Where your explanation becomes vague. Where you want to use a technical term because you don't actually understand what it means.

**Those are your knowledge gaps.** Go back to the source material and fill them.

### Step 4: Simplify and Refine
Now rewrite your explanation. Make it cleaner, simpler, more elegant. Use better analogies. Trim the fat.

## Why It Works

The Feynman Technique works because it combats the **illusion of knowledge**. We often think we understand something because we can recognize it or nod along when someone explains it. But recognition is not understanding.

When you're forced to produce an explanation from scratch, every gap in your understanding becomes painfully obvious. And that's exactly the point.

## A Practical Example

**Concept**: How does encryption work?

**Bad explanation**: "Encryption uses algorithms with public and private keys to secure data through mathematical functions that are computationally infeasible to reverse."

**Feynman explanation**: "Imagine you have a special lockbox. Anyone can put a message inside and lock it (that's the public key). But only you have the key to open it (that's the private key). The lock is designed so that even if someone examines it for a billion years, they can't figure out how to open it without the key."

See the difference? The second one actually teaches.

## The Bottom Line

If you can explain it simply, you understand it deeply. If you can't, you know exactly what to study next. The Feynman Technique turns studying from passive absorption into active construction.
    `,
    author: "The Professor",
    date: "2026-04-03",
    readTime: "6 min read",
    category: "Study Techniques",
    tags: ["Feynman technique", "learning", "teaching", "deep understanding"],
    coverGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    icon: "Lightbulb",
  },
  {
    slug: "memory-palace-technique",
    title: "Memory Palaces: Lock Your Knowledge in Virtual Rooms",
    excerpt: "Ancient Roman orators used this spatial technique to remember three-hour speeches. Here is how you can use it to ace your finals.",
    content: `
## Spatial Memory is Your Superpower

Ever notice how you can perfectly remember the layout of your childhood home, but you can't remember a single date from history class? That's because humans evolved to navigate physical spaces, not abstract facts.

The **Method of Loci** (or Memory Palace) hacks this evolution.

## How to Build Your First Palace

1. **Choose a familiar place**: Your bedroom, your school, or your favorite park.
2. **Define a path**: Decide exactly how you'll walk through this space. Start at the door, move to the bed, then the desk, etc.
3. **Place your "vivid" items**: Turn abstract facts into bizarre, colorful, or funny images.
4. **Walk through it**: In your mind, walk the path and look at each image.

## Why "The Professor" Recommends It

The Professor's AI can help you generate these vivid images. If you're struggling to remember the steps of Mitosis, ask The Professor: "Help me create a memory palace for Mitosis." It will turn Prophase into a giant 'P' anchor in your kitchen, and Metaphase into a 'M' meeting in your living room.

## The Bottom Line

Don't memorize lists. Build houses. The more ridiculous the images in your palace, the longer you'll remember them.
    `,
    author: "The Professor",
    date: "2026-04-10",
    readTime: "5 min read",
    category: "Study Techniques",
    tags: ["memory palace", "mnemonics", "learning science"],
    coverGradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    icon: "Home",
  },
  {
    slug: "procrastination-loop-fix",
    title: "Breaking the Procrastination Loop with AI Planning",
    excerpt: "Procrastination isn't about laziness; it's about emotional regulation. Let's use AI to lower the barrier to starting.",
    content: `
## Why You Procrastinate

We procrastinate because a task feels too big, too scary, or too boring. Your brain sees the giant "Write Research Paper" task and triggers a fight-or-flight response. 

The secret to stopping is **lowering the friction of the first step**.

## Enter AI Planning

The Professor's planner doesn't just say "Study." It breaks the task into 15-minute microscopic steps:
- "Open the PDF"
- "Read the first two paragraphs"
- "Generate one flashcard"

Suddenly, the "Research Paper" isn't a mountain. It's a series of pebbles.

## The 2-Minute Rule

If a task takes less than 2 minutes, do it now. If it takes longer, ask The Professor to "break this down into 2-minute steps." 

## The Bottom Line

You don't need more discipline. You need a smaller starting line. Use AI to build that line for you.
    `,
    author: "The Professor",
    date: "2026-04-12",
    readTime: "4 min read",
    category: "Academic Skills",
    tags: ["procrastination", "productivity", "AI tools"],
    coverGradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    icon: "Zap",
  },
  {
    slug: "writing-better-essays-bloom",
    title: "Writing Better Essays with Bloom's Taxonomy",
    excerpt: "Stop just describing facts. Start evaluating them. Here is how to use higher-order thinking to jump from a B to an A.",
    content: `
## The Levels of Thinking

Most students write at the **Knowledge** and **Comprehension** levels. They describe what happened and explain why. That's a B-grade essay.

To get an A, you need to reach the top of Bloom's Taxonomy: **Analysis, Synthesis, and Evaluation**.

## Moving Up the Pyramid

- **Analysis**: Don't just say "The economy crashed." Ask "How did the interaction between housing prices and interest rates cause the crash?"
- **Evaluation**: Don't just explain a theory. Critique it. "While Smith's theory works in short-term markets, it fails to account for long-term climate impacts."

## How The Professor Helps

Ask The Professor: "Evaluate my essay intro using Bloom's Taxonomy." It will tell you if you're stuck at the 'Understanding' level and suggest how to add 'Critical Evaluation'.

## The Bottom Line

The best writers don't have better vocabulary; they have better questions. Use Bloom's Taxonomy to ask those questions.
    `,
    author: "The Professor",
    date: "2026-04-14",
    readTime: "6 min read",
    category: "Academic Skills",
    tags: ["essay writing", "critical thinking", "Bloom's taxonomy"],
    coverGradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    icon: "PenTool",
  },
  {
    slug: "science-of-sleep-study",
    title: "The Science of Sleep: The Ultimate Study Technique",
    excerpt: "While you sleep, your brain is busy 'replaying' what you learned that day. Learn why pulling an all-nighter is academic suicide.",
    content: `
## Memory Consolidation Happens at Night

Think of your brain like a shelf. During the day, you're throwing books on the floor. During sleep, your brain picks them up and organizes them into the library. 

If you don't sleep, the books stay on the floor. You haven't truly "learned" anything until you've slept on it.

## The All-Nighter Myth

Pulling an all-nighter reduces your cognitive performance to that of someone who is legally intoxicated. Your ability to recall information drops by up to 40%.

## The Professor's Sleep Tip

Don't study new material right before bed if it makes you anxious. Instead, review **The Professor's flashcards** 30 minutes before sleep. This signals to your brain that this specific information is high priority for consolidation.

## The Bottom Line

Sleep is not a luxury. It is a biological necessity for long-term memory. Go to bed.
    `,
    author: "The Professor",
    date: "2026-04-16",
    readTime: "5 min read",
    category: "Study Techniques",
    tags: ["sleep science", "biology", "health", "study tips"],
    coverGradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    icon: "Moon",
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(blogPosts.map((post) => post.category))];
}
