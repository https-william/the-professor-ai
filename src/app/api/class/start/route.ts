import { NextRequest, NextResponse } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { validateContent, validateTopic, safeErrorResponse } from "@/lib/validation";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Validate topic or content with injection protection
        let content = body.documentContent || body.topic;
        
        if (body.documentContent) {
            const contentResult = validateContent(body.documentContent);
            if (!contentResult.isValid) {
                return safeErrorResponse(contentResult.error || "Invalid content");
            }
            content = contentResult.sanitized!;
        } else if (body.topic) {
            const topicResult = validateTopic(body.topic);
            if (!topicResult.isValid) {
                return safeErrorResponse(topicResult.error || "Invalid topic");
            }
            content = topicResult.sanitized!;
        } else {
            return safeErrorResponse("Please provide a topic or content");
        }
        
        // Truncate if too long (already validated max in validateContent)
        if (content.length > 50000) {
            content = content.substring(0, 50000) + "\n\n[Content truncated...]";
        }

        const prompt = `You are The Professor, an elite academic mentor using the Feynman Technique.

TOPIC: "${content}"

Create a COMPREHENSIVE lesson with 6-7 sections. Each section should be substantial (2-3 paragraphs).

Return ONLY valid JSON (no markdown):
{
  "title": "Lesson title",
  "sections": [
    {
      "id": "1",
      "title": "Core Concept",
      "content": "Explain the fundamental concept in simple terms. Use analogies. 2-3 paragraphs.",
      "keyTakeaway": "One sentence summary"
    },
    {
      "id": "2",
      "title": "Key Terminology",
      "content": "Define important terms. Explain why each matters.",
      "keyTakeaway": "Summary"
    },
    {
      "id": "3",
      "title": "Deep Dive",
      "content": "Detailed exploration. Build on basics with more complexity.",
      "keyTakeaway": "Summary"
    },
    {
      "id": "4",
      "title": "Common Misconceptions",
      "content": "What do people get wrong? Clarify confusions.",
      "keyTakeaway": "Summary"
    },
    {
      "id": "5",
      "title": "Real-World Applications",
      "content": "Practical examples. How is this used in real life?",
      "keyTakeaway": "Summary"
    },
    {
      "id": "6",
      "title": "Practice & Self-Test",
      "content": "Questions to test understanding. Mini exercises.",
      "keyTakeaway": "Summary"
    },
    {
      "id": "7",
      "title": "Summary & Next Steps",
      "content": "Recap key points. Suggest what to learn next.",
      "keyTakeaway": "Summary"
    }
  ],
  "summary": "Brief overall summary"
}`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: {"status":"generating","message":"The Professor is preparing your lesson..."}\n\n`));
                    
                    const responseText = await hydraGenerateContent(prompt, { timeoutMs: 45000 });
                    
                    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    
                    // Stream title first
                    controller.enqueue(encoder.encode(`data: {"type":"title","title":"${parsed.title}"}\n\n`));
                    
                    // Stream each section
                    for (let i = 0; i < parsed.sections.length; i++) {
                        const section = parsed.sections[i];
                        controller.enqueue(encoder.encode(`data: {"type":"section","index":${i},"total":${parsed.sections.length},"section":${JSON.stringify(section)}}\n\n`));
                        await new Promise(r => setTimeout(r, 100));
                    }
                    
                    controller.enqueue(encoder.encode(`data: {"status":"complete","summary":"${parsed.summary || ''}"}\n\n`));
                    controller.close();
                } catch (error: any) {
                    console.error("Class Stream Error:", error);
                    controller.enqueue(encoder.encode(`data: {"status":"error","message":"${error?.message || 'Failed to start class'}"}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error("Class Start Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
