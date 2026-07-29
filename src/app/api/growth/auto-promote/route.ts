import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { packTitle, referralCode, platform } = body;

        const shareUrl = `https://theprofessor.xyz/signup?ref=${referralCode || "SCHOLAR"}`;
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID;

        // If Telegram bot is configured in environment, auto-broadcast to channel
        if (platform === 'telegram' && telegramBotToken && telegramChannelId) {
            const message = `📚 *New Study Pack Created on The Professor AI*\n\nTitle: *${packTitle || "Course Study Notes"}*\n\nStudy flashcards, Feynman summaries & quizzes for free:\n👉 [Open Study Set](${shareUrl})`;
            
            await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: telegramChannelId,
                    text: message,
                    parse_mode: "Markdown",
                    disable_web_page_preview: false
                })
            });

            return NextResponse.json({ success: true, broadcast: "telegram_channel" });
        }

        // Default response instructing client fallback to direct deep-link
        return NextResponse.json({ 
            success: true, 
            broadcast: "client_deeplink",
            shareUrl 
        });

    } catch (err: any) {
        console.error("Auto Promote Error:", err);
        return NextResponse.json({ error: err.message || "Failed to auto-promote" }, { status: 500 });
    }
}
