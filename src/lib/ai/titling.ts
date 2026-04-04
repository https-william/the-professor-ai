
export async function generateAITitle(context: string, type: 'chat' | 'quiz' | 'flashcards' | 'summary'): Promise<string> {
    const keys = (process.env.GROQ_API_KEY || "").split(",").filter(Boolean);
    const apiKey = keys[Math.floor(Math.random() * keys.length)];

    if (!apiKey) {
        // Fallback to simple slice if no API key
        return context.substring(0, 40) + (context.length > 40 ? "..." : "");
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `You are a title generator for an AI study app. Your goal is to output exactly 3-6 words representing a brilliant, academic, and highly descriptive title for the given input. 
                        
Guidelines:
- Output ONLY the title. 
- No quotes, no periods, no introductory text.
- Make it sound premium and professional.
- For quizzes/flashcards/summaries: Focus on the subject matter/topic.
- Language: English.`
                    },
                    {
                        role: "user",
                        content: `Type: ${type.toUpperCase()}\nContent: ${context.substring(0, 3000)}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 20
            })
        });

        if (!response.ok) throw new Error("Groq API failed");

        const result = await response.json();
        let title = result.choices[0]?.message?.content?.trim() || "Untitled Session";
        
        // Final cleanup
        title = title.replace(/^["']|["']$/g, '').replace(/\.$/, '');
        
        return title;
    } catch (error) {
        console.error("Groq Title Generation Error:", error);
        return context.substring(0, 40) + (context.length > 40 ? "..." : "");
    }
}
