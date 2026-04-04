import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { title, context } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are The Professor's Syllabus Architect. 
        Analyze the following study material and generate a structured 4-week study roadmap.
        
        MATERIAL CONTEXT:
        ${context}
        
        OUTPUT FORMAT (Strict JSON):
        {
            "title": "Roadmap Title",
            "description": "Short overview",
            "weeks": [
                {
                    "week": 1,
                    "focus": "Core concepts",
                    "tasks": [
                        { "title": "Task name", "duration": "30m", "objective": "What to learn" }
                    ]
                }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const roadmapData = JSON.parse(result.response.text());

        // Save to Database
        const { data: generation, error: dbError } = await supabase
            .from("generations")
            .insert({
                user_id: user.id,
                type: 'roadmap',
                title: roadmapData.title || `Roadmap: ${title}`,
                content: roadmapData
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database save error:", dbError);
        }

        return NextResponse.json({ success: true, roadmap: generation });
    } catch (error: any) {
        console.error("Roadmap API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
