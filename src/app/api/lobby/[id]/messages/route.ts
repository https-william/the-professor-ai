export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: roomId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch messages and join profiles
        // We order by created_at asc so messages stream chronologically
        const { data: messages, error: messagesError } = await supabase
            .from("room_messages")
            .select(`
                id,
                content,
                message_type,
                created_at,
                user_id,
                profiles:user_id (
                    id,
                    username,
                    first_name,
                    avatar_url
                )
            `)
            .eq("room_id", roomId)
            .order("created_at", { ascending: true })
            .limit(100);

        if (messagesError) {
            console.error("Messages fetch error:", messagesError);
            return NextResponse.json({ error: "Failed to fetch room messages" }, { status: 500 });
        }

        const formatted = messages?.map(msg => {
            const profile = Array.isArray(msg.profiles) 
                ? msg.profiles[0] 
                : msg.profiles;

            return {
                id: msg.id,
                content: msg.content,
                type: msg.message_type,
                createdAt: msg.created_at,
                user: profile ? {
                    id: profile.id,
                    name: profile.username || profile.first_name || 'Member',
                    avatar: profile.avatar_url
                } : {
                    id: msg.user_id,
                    name: 'Member'
                }
            };
        }) || [];

        return NextResponse.json({
            success: true,
            messages: formatted
        });
    } catch (error) {
        console.error("Messages GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: roomId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content, message_type = 'text' } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
        }

        // Insert message
        const { data: newMsg, error: insertError } = await supabase
            .from("room_messages")
            .insert({
                room_id: roomId,
                user_id: user.id,
                content: content.trim(),
                message_type
            })
            .select()
            .single();

        if (insertError) {
            console.error("Message insert error:", insertError);
            return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
        }

        // Fetch user profile for return payload
        const { data: profile } = await supabase
            .from("profiles")
            .select("username, first_name, avatar_url")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            success: true,
            message: {
                id: newMsg.id,
                content: newMsg.content,
                type: newMsg.message_type,
                createdAt: newMsg.created_at,
                user: {
                    id: user.id,
                    name: profile?.username || profile?.first_name || 'Member',
                    avatar: profile?.avatar_url
                }
            }
        });
    } catch (error) {
        console.error("Messages POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
