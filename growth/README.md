# /growth — The Professor Growth Operations

> Zero-budget, high-leverage growth infrastructure for The Professor.  
> Every script here is built around one principle: **provide genuine value first, mention the product second (or never).**

---

## Directory Structure

```
growth/
├── .agents/
│   └── rules/
│       └── marketing-guide.md      ← Brand voice codex (non-negotiable)
├── scripts/
│   ├── config.json                 ← Scanner configuration & keywords
│   ├── forum-scanner.js            ← Finds high-intent student threads
│   └── reply-drafter.js            ← Generates value-first reply drafts
├── seo/
│   ├── keyword-map.json            ← 50 high-intent academic keywords
│   ├── page-generator.js           ← Generates study concept pages
│   └── pages/                      ← Generated markdown pages (output)
├── data/
│   ├── leads.json                  ← Scanner output (auto-created)
│   └── drafts/                     ← Reply drafts for review (auto-created)
└── README.md                       ← You are here
```

---

## Quick Start

### 1. Scan Student Forums for High-Intent Threads

```bash
# Full scan (Reddit API + Nairaland via Playwright)
node growth/scripts/forum-scanner.js

# Reddit only (faster, no browser needed)
node growth/scripts/forum-scanner.js --reddit-only

# Single keyword search
node growth/scripts/forum-scanner.js --keyword "exam anxiety"
```

Output: `growth/data/leads.json`

### 2. Generate Reply Drafts

```bash
# Draft replies for all leads
node growth/scripts/reply-drafter.js

# First 5 leads only
node growth/scripts/reply-drafter.js --limit 5

# Single lead by URL
node growth/scripts/reply-drafter.js --url "https://reddit.com/r/studytips/..."
```

Output: `growth/data/drafts/reply-{slug}.md`

> **IMPORTANT**: Every draft is for HUMAN REVIEW before posting.  
> Never auto-post. Read the draft. Edit it. Make it yours. Then post.

### 3. Generate Programmatic SEO Study Pages

```bash
# Generate all 50 study concept pages
node growth/seo/page-generator.js

# Biology pages only
node growth/seo/page-generator.js --subject Biology

# Single page
node growth/seo/page-generator.js --slug what-is-osmosis
```

Output: `growth/seo/pages/{slug}.md`

---

## The Playbook

### Layer 1: Social Listening → Value-First Replies

```
Student asks question on Reddit/Nairaland
    → Scanner finds it
    → Drafter generates a genuinely helpful reply
    → Human reviews & posts
    → Student gets value
    → Some fraction discover The Professor organically
```

**Rules:**
- Lead with empathy. Name the pain. Don't explain it.
- Give real, actionable study advice. Solve something.
- Mention The Professor ONLY if it's genuinely the best answer.
- Sound like a human who's been through it, not a brand account.

### Layer 2: Programmatic SEO → Search Flywheel

```
Student Googles "what is osmosis explained simply"
    → Our page ranks (Nigerian-specific, conversational, high-quality)
    → Student gets a genuinely good explanation
    → Soft CTA: "Upload your notes for a full exam simulation"
    → Student signs up
```

**Rules:**
- Every page must be genuinely educational. No SEO-stuffed garbage.
- Write like a friend explaining it over indomie at midnight.
- Nigerian exam context is mandatory (WAEC, JAMB, NECO relevance).
- Each page has 3 active recall questions (test yourself, don't just read).

### Layer 3: Product-Embedded Virality (The WhatsApp Flywheel)

```
Student uses The Professor → Gets value → Shares branded output with course group
    → 50 students see it → Some fraction sign up → Repeat
```

This layer is built into the product itself, not this directory.  
At 1,200 users, even a 10% share rate = 6,000 new potential users/week.

---

## Brand Voice (Summary)

Read the full codex: `.agents/rules/marketing-guide.md`

**Quick reference:**
- Short is strategy. Headlines < 7 words.
- Never explain what they already know.
- Student = hero. The gap = villain. Never blame the student.
- Nigerian specificity: 100L not Freshman, course rep not class president.
- Everything screenshot-shareable without context.
- First person always. "We" not "The Professor."

**Banned words:** aggressive, mastery, strategic, offensive, dominance, crush, hack, obsolete, synergy, leverage, unlock, game-changer, revolutionary, cutting-edge, seamless.

---

## Configuration

Edit `scripts/config.json` to:
- Add/remove target subreddits and forums
- Update keyword lists
- Adjust rate limiting
- Change output paths

---

## Dependencies

- **Node.js** (v18+)
- **Playwright** (already in project: `playwright@^1.60.0`)
- No additional installs required. Everything uses Node built-ins + Playwright.

---

## Ethics

This is growth hacking, not spam. The non-negotiable rules:

1. **Every reply must provide genuine value** even if The Professor is never mentioned.
2. **Every SEO page must be genuinely educational** — something a student would bookmark.
3. **Never auto-post anything.** Every piece of content is reviewed by a human.
4. **Respect rate limits.** We're guests on these platforms.
5. **No fake accounts, no astroturfing, no vote manipulation.**

We grow by being the most helpful voice in the room. That's it.
