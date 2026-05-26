#!/usr/bin/env node
/**
 * reply-drafter.js
 * ────────────────────────────────────────────────────────
 * Reads leads from growth/data/leads.json and generates
 * brand-voice reply drafts saved to growth/data/drafts/.
 *
 * Usage:
 *   node growth/scripts/reply-drafter.js              # all leads
 *   node growth/scripts/reply-drafter.js --limit 5    # first 5
 *   node growth/scripts/reply-drafter.js --url "…"    # single lead
 * ────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");

// ── Paths ────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..", "..");
const LEADS_PATH = path.join(ROOT, "growth", "data", "leads.json");
const DRAFTS_DIR = path.join(ROOT, "growth", "data", "drafts");

// ── CLI arg parsing (lightweight, no deps) ───────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { limit: Infinity, url: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      opts.limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--url" && args[i + 1]) {
      opts.url = args[i + 1];
      i++;
    }
  }
  return opts;
}

// ── Templates ────────────────────────────────────────────
// Each template targets a specific pain-point cluster.
// Fields:
//   id        – unique slug
//   keywords  – phrases that trigger this template (lowercase)
//   hook      – 1-2 sentences naming the pain
//   value     – 2-4 sentences giving a real technique
//   bridge    – 0-1 sentence soft-mentioning theprofessor.xyz
//   close     – 1 short encouraging sentence
const TEMPLATES = [
  {
    id: "active-recall",
    keywords: [
      "can't remember",
      "forget everything",
      "read but can't recall",
      "memory",
      "don't remember",
      "keep forgetting",
    ],
    hook: "That thing where you read an entire chapter and your brain acts like it never happened? Yeah, we've all been there.",
    value:
      "Close the textbook after each section and write down everything you remember — no peeking. It'll feel rough the first time (you'll stare at the blank page like 😐), but that struggle is literally your brain building stronger connections. This is called active recall, and research shows it beats re-reading by a mile. Even 5 minutes of recall practice after a 30-minute study block changes everything.",
    bridge:
      "If you want something that auto-generates recall questions from your notes, theprofessor.xyz does that for free — might save you some setup time.",
    close: "You remember more than you think. You just haven't tested yourself yet.",
  },
  {
    id: "exam-anxiety",
    keywords: [
      "exam anxiety",
      "nervous before exam",
      "panic during test",
      "test anxiety",
      "scared of exams",
      "blanking out",
      "freeze during exam",
    ],
    hook: "Walking into the exam hall feeling like your heart is trying to leave your body? That's not weakness — it's your brain treating the exam like a threat because it hasn't seen the environment enough.",
    value:
      "Try this: before the real exam, simulate it. Set a timer, sit at a desk, put your phone away, and answer past questions under real conditions. Do it two or three times. Your brain starts going \"oh, I've been here before\" and the panic drops. It's called desensitization — same idea therapists use. Also, the night before? Stop studying by 9pm. Seriously. Sleep does more for recall than one more hour of cramming ever will.",
    bridge:
      "theprofessor.xyz has an oral exam simulator that grills you like a real examiner — some people use it just to get comfortable with pressure.",
    close: "You're more prepared than your anxiety wants you to believe.",
  },
  {
    id: "retrieval-practice",
    keywords: [
      "study for hours",
      "still fail",
      "study hard but",
      "reading doesn't work",
      "hours of studying",
      "studying a lot",
      "put in effort but",
    ],
    hook: "Putting in 6-hour study sessions and still getting results that don't match the effort? The hours aren't the problem — it's what you're doing during them.",
    value:
      "Most people spend 80% of study time re-reading or highlighting. That feels productive, but your brain is just recognizing words, not learning them. Flip it: spend 80% of your time testing yourself. Read for 10 minutes, then close the book and quiz yourself for 30. Use past questions, make up questions, explain concepts out loud to an imaginary Tunde who knows nothing. That's retrieval practice, and it's the single most evidence-backed study method that exists.",
    bridge:
      "There's a free tool at theprofessor.xyz that turns your notes into practice questions automatically — saves you the effort of writing them yourself.",
    close: "Smart studying isn't about more hours. It's about the right 45 minutes.",
  },
  {
    id: "subject-specific",
    keywords: [
      "how to study",
      "best way to study",
      "tips for studying",
      "how do I learn",
      "study method for",
      "study plan",
      "study guide",
    ],
    hook: "Looking for a study method that actually sticks? Good — you're already ahead of most people by asking the right question.",
    value:
      "Here's a micro-method that works across subjects: the 3-Pass system. Pass 1 — skim the material in 15 minutes, just headings and key terms (get the map). Pass 2 — read properly and take short notes in your own words. Pass 3 — close everything and try to teach the topic to yourself out loud, like you're explaining it to Amaka who missed the lecture. Where you stumble? That's exactly what you need to review. Three passes, one topic, done in under an hour.",
    bridge:
      "If you want to speed up Pass 3, theprofessor.xyz can simulate a tutor who asks you questions about your notes — like a study buddy who actually read the material.",
    close: "You don't need to study everything. Just study the right things, the right way.",
  },
  {
    id: "waec-jamb",
    keywords: [
      "waec",
      "jamb",
      "neco",
      "utme",
      "post utme",
      "cbt",
      "nigerian exam",
      "jamb preparation",
      "waec preparation",
      "jamb score",
    ],
    hook: "WAEC and JAMB prep can feel like you're fighting a whole war with just vibes and past questions. Let's make it simpler.",
    value:
      "First: past questions are king, but most people use them wrong. Don't just read answers — attempt each question under timed conditions BEFORE checking. For JAMB CBT specifically, practice on a computer or phone to build screen-reading speed (it's a different skill from paper). Second: focus 70% of your time on your three strongest subjects. Getting 75+ in three subjects matters more than getting 55 in everything. That's how Ifeanyi went from 203 to 287 — fewer subjects, deeper prep.",
    bridge:
      "theprofessor.xyz is free and lets you upload your notes to generate practice questions — works well for JAMB-style revision.",
    close: "You've got this. Thousands of students pass every year, and you're putting in the work to be one of them.",
  },
  {
    id: "spaced-repetition",
    keywords: [
      "flashcard",
      "anki",
      "spaced repetition",
      "flashcards",
      "best flashcard app",
      "srs",
      "review schedule",
    ],
    hook: "Looking for flashcard recommendations? Smart move — but the app matters less than how you use it.",
    value:
      "Spaced repetition works because it shows you cards right before you're about to forget them. The science is rock-solid (look up Ebbinghaus if you're curious). The key rule most people break: keep each card to ONE fact. Not \"explain photosynthesis\" — that's an essay, not a flashcard. More like \"What gas do plants absorb during photosynthesis?\" One question, one answer, done. Also, review daily — even just 10 minutes. Consistency beats marathon sessions every time.",
    bridge:
      "If making cards from scratch feels slow, theprofessor.xyz can auto-generate them from your notes — you just review.",
    close: "10 minutes a day beats 3 hours on Sunday. Your future self will thank you.",
  },
  {
    id: "cramming-fix",
    keywords: [
      "cramming",
      "cram",
      "last minute",
      "night before",
      "all nighter",
      "overnight study",
      "all-nighter",
      "study last minute",
    ],
    hook: "We both know cramming doesn't really work — you've probably proven that to yourself already. The question is: what do you do instead?",
    value:
      "The answer is the spacing effect. Instead of 6 hours the night before, do 1 hour across 6 different days. Your brain consolidates memories during sleep, so spreading study across days gives you 6 nights of memory processing instead of zero. Start simple: after each lecture, spend 15 minutes the same evening writing down what you remember. Then revisit those notes 3 days later. Then again before the exam. Three touchpoints, spaced out, and you'll remember more than Bolu who pulled an all-nighter and forgot everything by Question 5.",
    bridge:
      "theprofessor.xyz has a spacing scheduler built in — it reminds you when to revisit topics so you don't have to plan it yourself.",
    close: "Your bed misses you. Study earlier, sleep better, remember more.",
  },
  {
    id: "feynman-technique",
    keywords: [
      "feynman",
      "explain simply",
      "teach to understand",
      "simplify",
      "don't understand",
      "too complex",
      "confused by",
      "understand concepts",
    ],
    hook: "Feeling like the material is written in a language you technically speak but somehow can't understand? That usually means you're reading for recognition, not comprehension.",
    value:
      "Try the Feynman Technique — it's embarrassingly simple but it works. Pick one concept. Explain it out loud (or on paper) like you're talking to a 12-year-old. No jargon, no textbook phrases. Where you get stuck or start waving your hands vaguely? That's the gap. Go back to the source, fill that specific gap, then explain again. Repeat until it's smooth. Amaka used this for Organic Chemistry and went from \"I don't even know what I don't know\" to teaching her study group.",
    bridge:
      "theprofessor.xyz basically automates this — it asks you to explain concepts from your notes and tells you where your explanation has gaps.",
    close: "If you can explain it simply, you actually understand it. That's the whole test.",
  },
  {
    id: "motivation-burnout",
    keywords: [
      "no motivation",
      "burned out",
      "burnout",
      "tired of studying",
      "can't focus",
      "distracted",
      "procrastinating",
      "procrastination",
      "lazy",
      "unmotivated",
    ],
    hook: "Can't seem to start studying even though the exam is RIGHT THERE? That's not laziness — your brain is overwhelmed and doesn't know where to begin.",
    value:
      "Here's what actually works: make the first step stupidly small. Don't say \"I'll study Biology for 3 hours.\" Say \"I'll open my notes and read one page.\" That's it. One page. What happens next is momentum — your brain goes \"well, I'm already here\" and keeps going. Also, study in 25-minute blocks with 5-minute breaks (Pomodoro). It sounds basic but it works because you're never more than 25 minutes from a break. Remove your phone from the room. Not on silent — physically gone. Your focus will double, I promise.",
    bridge: "",
    close:
      "You don't need motivation. You need a small enough first step. Start with one page.",
  },
  {
    id: "group-study",
    keywords: [
      "study group",
      "group study",
      "study with friends",
      "study partner",
      "study alone",
      "study together",
    ],
    hook: "Study groups can be amazing or a complete waste of time — there's almost no in-between.",
    value:
      "The trick is structure. Before meeting, everyone picks one topic to teach the group (not read from a textbook — actually teach). Teaching forces understanding in a way passive listening never does. Keep the group small (3-4 max), set a timer for each person (15 min), and save socializing for after. If your group is mostly vibes and group chat energy, study alone and meet up for the fun part later. Bolu's study group does \"quiz battles\" — they write questions for each other and compete. Learning disguised as competition.",
    bridge:
      "If you're studying solo, theprofessor.xyz can be like a study partner that actually asks you hard questions — minus the group chat distractions.",
    close:
      "The best study group is three focused people. More than that and it's a hangout.",
  },
];

// ── Helpers ──────────────────────────────────────────────

/** Convert a title string to a filename-safe slug */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

/** Find the best-matching template for a given lead */
function matchTemplate(lead) {
  const haystack = [
    lead.title || "",
    lead.snippet || "",
    lead.body || "",
    ...(lead.keywords || []),
  ]
    .join(" ")
    .toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const tpl of TEMPLATES) {
    let score = 0;
    for (const kw of tpl.keywords) {
      if (haystack.includes(kw)) {
        score += kw.split(" ").length; // multi-word matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  return bestMatch;
}

/** Personalize template text with lead-specific context */
function personalize(text, lead) {
  // Light personalization: inject thread context if possible
  let result = text;

  // If the lead has a subject mention, we can weave it in
  if (lead.subject) {
    result = result.replace(/the material/i, `${lead.subject}`);
  }

  return result;
}

/** Build the full markdown draft for a lead */
function buildDraft(lead, template) {
  const now = new Date().toISOString();
  const keywords = (lead.keywords || []).join(", ");

  // ── YAML frontmatter ──
  const frontmatter = [
    "---",
    `source_url: ${lead.url || "unknown"}`,
    `source_title: "${(lead.title || "Untitled").replace(/"/g, '\\"')}"`,
    `source_forum: ${lead.forum || lead.source || "unknown"}`,
    `keywords: [${keywords}]`,
    `generated_at: ${now}`,
    `template_used: ${template.id}`,
    "status: draft",
    "---",
  ].join("\n");

  // ── Reply body ──
  const sections = [];

  sections.push(personalize(template.hook, lead));
  sections.push("");
  sections.push(personalize(template.value, lead));

  if (template.bridge && template.bridge.trim().length > 0) {
    sections.push("");
    sections.push(personalize(template.bridge, lead));
  }

  sections.push("");
  sections.push(personalize(template.close, lead));

  return `${frontmatter}\n\n${sections.join("\n")}`;
}

// ── Main ─────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);

  console.log("");
  console.log("📝  The Professor — Reply Drafter");
  console.log("─".repeat(42));

  // 1. Read leads
  if (!fs.existsSync(LEADS_PATH)) {
    console.log(`\n❌  Leads file not found at: ${LEADS_PATH}`);
    console.log("   Run the forum scanner first to generate leads.json.\n");
    process.exit(1);
  }

  let leads;
  try {
    const raw = fs.readFileSync(LEADS_PATH, "utf-8");
    leads = JSON.parse(raw);
    if (!Array.isArray(leads)) {
      // Support { leads: [...] } wrapper format
      leads = leads.leads || leads.results || [];
    }
  } catch (err) {
    console.log(`\n❌  Failed to parse leads.json: ${err.message}\n`);
    process.exit(1);
  }

  console.log(`📂  Loaded ${leads.length} lead(s) from leads.json`);

  // 2. Filter by URL if specified
  if (opts.url) {
    leads = leads.filter((l) => l.url === opts.url);
    if (leads.length === 0) {
      console.log(`\n⚠️   No lead found matching URL: ${opts.url}\n`);
      process.exit(0);
    }
    console.log(`🔗  Filtered to 1 lead by URL`);
  }

  // 3. Apply limit
  if (opts.limit < leads.length) {
    leads = leads.slice(0, opts.limit);
    console.log(`✂️   Limited to ${opts.limit} lead(s)`);
  }

  // 4. Ensure drafts directory exists
  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
    console.log(`📁  Created drafts directory: ${DRAFTS_DIR}`);
  }

  // 5. Process each lead
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of leads) {
    const title = lead.title || "Untitled";
    const slug = slugify(title);
    const outFile = path.join(DRAFTS_DIR, `reply-${slug}.md`);

    // Skip if draft already exists
    if (fs.existsSync(outFile)) {
      console.log(`⏭️   Skipped (exists): ${title}`);
      skipped++;
      continue;
    }

    // Match template
    const template = matchTemplate(lead);
    if (!template) {
      console.log(`⚠️   No template match: ${title}`);
      skipped++;
      continue;
    }

    // Build & write draft
    try {
      const draft = buildDraft(lead, template);
      fs.writeFileSync(outFile, draft, "utf-8");
      console.log(`✅  Generated (${template.id}): reply-${slug}.md`);
      generated++;
    } catch (err) {
      console.log(`❌  Error writing draft for "${title}": ${err.message}`);
      errors++;
    }
  }

  // 6. Summary
  console.log("");
  console.log("─".repeat(42));
  console.log("📊  Summary");
  console.log(`   ✅ Drafts generated : ${generated}`);
  console.log(`   ⏭️  Skipped (exists) : ${skipped}`);
  console.log(`   ❌ Errors           : ${errors}`);
  console.log(`   📁 Output directory : ${DRAFTS_DIR}`);
  console.log("");

  if (generated > 0) {
    console.log("💡  Next step: review drafts, tweak voice, then post.");
    console.log("    Remember — be genuinely helpful first, promotional never.\n");
  }
}

main();
