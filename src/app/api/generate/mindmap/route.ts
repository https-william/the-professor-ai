import { NextRequest, NextResponse } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json();

        if (!content || content.trim().length < 50) {
            return NextResponse.json({ error: "Please provide more content" }, { status: 400 });
        }

        const prompt = `Create a hierarchical mind map from the following content.

CONTENT:
${content.substring(0, 35000)}

Return ONLY valid JSON (no markdown):
{
  "title": "Central topic",
  "nodes": [
    {
      "id": "1",
      "label": "Main branch 1",
      "children": [
        {"id": "1.1", "label": "Sub-topic"},
        {"id": "1.2", "label": "Sub-topic"}
      ]
    }
  ]
}`;

        const responseText = await hydraGenerateContent(prompt, { timeoutMs: 30000 });
        
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({ 
            mindmap: parsed,
            title: parsed.title
        });

    } catch (error: any) {
        console.error("Mindmap Error:", error);
        return NextResponse.json({ error: error?.message || "Failed to generate mindmap" }, { status: 500 });
    }
}
