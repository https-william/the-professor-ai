---
title: "Probability — What Are the Chances? (Let's Actually Calculate It)"
meta_description: "probability questions and solutions explained simply for Nigerian students. Covers Mathematics concepts for WAEC, JAMB, NECO, GCE. Active recall questions included."
subject: "Mathematics"
keywords:
  - "conditional probability"
  - "permutations"
  - "combinations"
  - "probability questions and solutions"
slug: "probability-questions-and-solutions"
difficulty: "foundational"
exam_relevance:
  - "WAEC"
  - "JAMB"
  - "NECO"
  - "GCE"
generated_at: "2026-05-23T16:40:14.659Z"
---

# Probability — What Are the Chances? (Let's Actually Calculate It)

## The 60-Second Breakdown

Probability measures how likely an event is to happen. It ranges from 0 (impossible) to 1 (certain). The basic formula: P(event) = number of favorable outcomes / total number of possible outcomes. If you roll a fair die, P(getting a 4) = 1/6, because there's one 4 out of six possible outcomes.

For combined events, there are two key rules. The Addition Rule (OR): P(A or B) = P(A) + P(B) - P(A and B). If events are mutually exclusive (can't happen at the same time), then P(A and B) = 0, so P(A or B) = P(A) + P(B). Example: P(rolling a 2 OR a 5) = 1/6 + 1/6 = 2/6 = 1/3. The Multiplication Rule (AND): P(A and B) = P(A) × P(B|A). If events are independent (one doesn't affect the other), then P(B|A) = P(B), so P(A and B) = P(A) × P(B). Example: P(getting heads on two coin flips) = 1/2 × 1/2 = 1/4. Conditional probability P(B|A) is the probability of B given that A has already happened. Tree diagrams are incredibly helpful for visualizing multi-stage probability problems — draw branches for each outcome, multiply along branches for AND, add between branches for OR. Permutations (order matters): ⁿPᵣ = n!/(n-r)!. Combinations (order doesn't matter): ⁿCᵣ = n!/[r!(n-r)!].

## Why This Shows Up on Your Exam

Probability is in every WAEC, JAMB, NECO, and GCE paper. It's unavoidable. Basic probability questions: "A bag contains 5 red and 3 blue balls. One ball is drawn at random. Find the probability that it is red" (5/8). JAMB loves questions with replacement vs without replacement — these change whether events are independent. "Two balls are drawn without replacement from a bag containing 4 white and 6 black balls. Find the probability that both are white" (4/10 × 3/9 = 12/90 = 2/15). WAEC sets longer problems involving tree diagrams for three-stage experiments. NECO tests permutations and combinations: "In how many ways can 5 books be arranged on a shelf?" (5! = 120). Know the complement rule: P(not A) = 1 - P(A). This is often the fastest way to solve "at least one" problems.

## The Common Trap

The biggest mistake: not reading whether the question says "with replacement" or "without replacement." With replacement, events are independent and probabilities stay the same. Without replacement, probabilities change because the total number of outcomes decreases. Another trap: adding probabilities when you should multiply (or vice versa). Use addition for OR, multiplication for AND. A tree diagram helps you avoid this confusion — just follow the branches. Also, students confuse permutations and combinations. If the question asks "how many ways can you ARRANGE" — that's permutation (order matters). If it asks "how many ways can you CHOOSE" or "SELECT" — that's combination (order doesn't matter). ⁵C₂ = 10 (choosing 2 from 5), but ⁵P₂ = 20 (arranging 2 from 5).

## Test Yourself

Don't just read — test yourself. Cover the sections above and try to answer these from memory:

1. A bag contains 7 red, 5 blue, and 3 green marbles. Two marbles are drawn without replacement. Find the probability that (i) both are red, (ii) they are of different colors.

2. Three coins are tossed simultaneously. Using a tree diagram or otherwise, find the probability of getting (i) exactly two heads, (ii) at least one tail.

3. A committee of 3 is to be selected from 5 men and 4 women. In how many ways can the committee be formed if it must include at least one woman?

## Go Deeper

Upload your Mathematics notes to The Professor and we'll turn them into a full exam simulation — with oral questions, marking, and feedback. Free. Takes 30 seconds.

[Try it now →](https://theprofessor.app)

<!-- JSON-LD Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "Probability — What Are the Chances? (Let's Actually Calculate It)",
  "description": "probability questions and solutions explained simply for Nigerian students. Covers Mathematics concepts for WAEC, JAMB, NECO, GCE. Active recall questions included.",
  "educationalLevel": "foundational",
  "about": {
    "@type": "Thing",
    "name": "probability questions and solutions"
  },
  "provider": {
    "@type": "Organization",
    "name": "The Professor AI",
    "url": "https://theprofessor.app"
  },
  "inLanguage": "en",
  "isPartOf": {
    "@type": "Course",
    "name": "Mathematics Study Guide",
    "provider": {
      "@type": "Organization",
      "name": "The Professor AI"
    }
  }
}
</script>
