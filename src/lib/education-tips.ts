export const EDUCATION_TIPS = [
    "Recall is king. Your highlighter is just a glorified crayon.",
    "Spaced repetition: Because your brain is like a leaky bucket, and I'm here to plug the holes.",
    "Explain it like I'm five. Or like you're explaining why you're late to a group chat.",
    "Sleep is the 'Save' button for your brain. Don't crash without hitting it.",
    "Mistakes are just data points. And today, we're being very scientific.",
    "A 15-minute study session beats a 5-hour panic session. Every single time.",
    "Your bed misses you. Let's finish this so you can go back to it.",
    "If you can't explain it simply, you're just using fancy words to hide the confusion. I see you.",
    "Stop reading the same page. Close the book and tell me what you actually remember.",
    "Coffee helps, but it doesn't write the exam for you. Unfortunately.",
    "Consistency beats intensity. 10 minutes a day is better than a 10-hour breakdown.",
    "Focus is a muscle. Today is leg day for your brain.",
    "Don't study until you get it right. Study until you're bored of being right.",
    "Anxiety is usually just 'Under-preparedness' in a trench coat. Let's unmask it.",
    "Your environment dictates your focus. Maybe move that phone to another room?",
    "Teach it to someone else. Even if it's just your cat. They're very judgmental, you know.",
    "Friction is a sign of learning. If it feels hard, it's actually working.",
    "Don't confuse 'Recognition' with 'Understanding'. You know the cover, but do you know the plot?",
    "Break big concepts into molecular pieces. It's easier to swallow that way.",
    "Active recall is the cheat code. Everything else is just theatre.",
    "The hardest subjects require the shortest intervals. 20 minutes on, 5 minutes of looking at the sky.",
    "Curiosity is the best catalyst. Why does this matter? Find the 'why' and the 'what' follows.",
    "Your brain is built for patterns, not just isolated facts. Connect the dots.",
    "Testing yourself is the only way to know if you've actually got it.",
    "Momentum is real. Just start the timer. 5 minutes is all I ask.",
    "The secret to passing? Knowing when to close the laptop and go for a walk.",
    "You've got this. And if you don't, we'll figure it out together. No stress.",
    "Life is too short to re-read notes you don't even like.",
    "Take a break before you actually need one. Your future self will thank you.",
    "High-speed learning doesn't mean rushing. It means not wasting time on the fluff.",
    "Your notes should be a conversation, not a monologue. Interrogate them.",
    "Review your highlights within 24 hours. The forgetting curve is a real hater.",
    "Don't wait for motivation. It's a flaky friend. Rely on the habit instead.",
    "Every 'A' starts with a 'Wait, what does this even mean?'",
    "Focus on the 'Good Parts'. The rest is just noise.",
    "A quick nap is better than a long panic. Trust the Professor on this one.",
    "Your future self is watching. Make them proud (or at least less stressed).",
    "Learning is a marathon. Pace yourself. We're not sprinting to a breakdown.",
    "If it's easy, you're probably just skimming. Dive a bit deeper.",
    "Small daily wins lead to big results. No need to move mountains today.",
    "Mistakes are proof that you're trying. And I like that about you.",
    "The more you test, the less you stress. It's just math.",
    "Get your time back. That's the whole point of this, isn't it?",
    "Smart study is about knowing what to ignore. Let's focus on the gold.",
    "Your brain needs oxygen and water. And maybe a snack. Go get some.",
    "Don't let a bad day turn into a bad week. Just reset and restart.",
    "Complexity is just simplicity that hasn't been explained well yet.",
    "Distraction is the thief of time. And your time is expensive.",
    "Learn the rules so you can break them with confidence later.",
    "The best way to predict your grade is to create it, one card at a time.",
    "Don't study for the test. Study so you can explain it to me over coffee."
];

export function getDailyTip(userId: string): string {
    if (!userId) return EDUCATION_TIPS[0];
    
    // Create a stable daily index for this user
    // Combine user ID and current date string to get a unique hash per user per day
    const dateStr = new Date().toISOString().split("T")[0];
    const hashString = `${userId}-${dateStr}`;
    
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
        hash = ((hash << 5) - hash) + hashString.charCodeAt(i);
        hash |= 0; // Convert to 32bit int
    }
    
    const index = Math.abs(hash) % EDUCATION_TIPS.length;
    return EDUCATION_TIPS[index];
}
