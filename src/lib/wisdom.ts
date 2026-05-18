/**
 * quotes.ts — The Professor's Curated Wisdom
 * 
 * Brand Voice: Witty, Warm, Eloquent, Mentorial.
 * Energy: Authentic Nigerian University vibes.
 */

export const PROFESSOR_WISDOM = [
    { text: "Don't worry about being perfect. Worry about being finished. Your bed misses you.", author: "The Professor" },
    { text: "A 20-minute nap is better than a 2-hour panic. Trust me on this one.", author: "The Professor" },
    { text: "Study less, but study better. Life is too short for re-reading the same paragraph 40 times.", author: "The Professor" },
    { text: "You've got this. And if you don't, I've got your notes. We'll figure it out together.", author: "The Professor" },
    { text: "The secret to passing? Knowing when to close the laptop and go for a walk.", author: "The Professor" },
    { text: "Your notes aren't supposed to be a novel. Let's just get to the good parts.", author: "The Professor" },
    { text: "Grades matter, but so does your sanity. Step back and breathe.", author: "The Professor" },
    { text: "Recall is king. Your highlighter is just a glorified crayon. Use it wisely.", author: "The Professor" },
    { text: "If you can't explain it simply, you're just hiding behind big words. I see you.", author: "The Professor" },
    { text: "100L energy is for those who haven't seen the exam timetable yet. Oya, stay sharp.", author: "The Professor" },
    { text: "The difference between a student and a scholar is knowing when to ask for the 'Insider Edge'.", author: "The Professor" },
    { text: "Your notes. Just the good parts.", author: "The Professor" },
    { text: "Your Course Rep is stressed, your HOD is busy. But the AI Librarian is always here.", author: "The Professor" },
    { text: "Passive reading is just professional daydreaming. Use active recall or don't bother.", author: "The Professor" },
    { text: "A 5.0 GPA starts with 5 minutes of focused thinking. Just start sha.", author: "The Professor" },
    { text: "Caffeine is a tool, not a meal. Eat something before the 400L burnout sets in.", author: "The Professor" },
    { text: "The exam hall is not a place for discovery. We do the discovery here.", author: "The Professor" },
    { text: "Carry-overs are not the end of the world, but your sleep schedule might be.", author: "The Professor" },
    { text: "Eloquent writing won't save a weak argument. Know your facts first.", author: "The Professor" },
    { text: "Oya, enough staring at the blank page. Let's generate a plan and go from there.", author: "The Professor" },
    { text: "The syllabus is long sha, but we are smarter. We prioritize the heavy hitters.", author: "The Professor" },
    { text: "Spaced repetition is the only cheat code that actually works in real life.", author: "The Professor" },
    { text: "Your phone is the biggest barrier between you and your first-class degree. Drop it sha.", author: "The Professor" },
    { text: "Academic success is 20% intelligence and 80% just showing up prepared.", author: "The Professor" },
    { text: "Don't let the HOD's frown scare you. We have the data they're looking for.", author: "The Professor" },
    { text: "Consistency is boring, but so is failing. Choose your boring wisely.", author: "The Professor" },
    { text: "The best time to study was yesterday. The second best time is now. Oya, move.", author: "The Professor" },
    { text: "We are scholars, not robots. Take 15 minutes to step away from the screen and clear your mind.", author: "The Professor" },
    { text: "Your brain is a supercomputer. Don't feed it junk content before a study session.", author: "The Professor" },
    { text: "The Professor knows your potential. Now, let's make the HOD see it too.", author: "The Professor" },
    { text: "One good summary is worth ten thick textbooks. Let's distill the good parts.", author: "The Professor" },
    { text: "Academic rigor is not about suffering; it's about precision. Be surgical.", author: "The Professor" },
    { text: "The world is waiting for your ideas. But first, we need to pass this exam.", author: "The Professor" },
    { text: "Sleep is the final step of learning. Your brain needs time to save the files.", author: "The Professor" },
    { text: "If the concepts are flying over your head, maybe you're standing too low. Level up sha.", author: "The Professor" },
];

export function getDailyWisdom() {
    // Deterministic daily quote based on date string
    const today = new Date();
    const index = (today.getFullYear() * 365 + today.getMonth() * 30 + today.getDate()) % PROFESSOR_WISDOM.length;
    return PROFESSOR_WISDOM[index];
}
