import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        if (content.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
        }

        // Verify user is a member of the room
        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select("id, members, host_id")
            .eq("id", id)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const isMember = (room.members || []).some((m: any) => m.user_id === user.id);
        if (!isMember && room.host_id !== user.id) {
            return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
        }

        // Insert message
        const { data: message, error: messageError } = await supabase
            .from("room_messages")
            .insert({
                room_id: id,
                user_id: user.id,
                content: content.trim(),
                message_type: 'text'
            })
            .select(`
                *,
                user:profiles!user_id(id, username, first_name, avatar_url)
            `)
            .single();

        if (messageError) {
            console.error("Message insert error:", messageError);
            return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                content: message.content,
                type: message.message_type,
                createdAt: message.created_at,
                user: message.user ? {
                    id: message.user.id,
                    name: message.user.username || message.user.first_name || 'Unknown',
                    avatar: message.user.avatar_url
                } : null
            }
        });
    } catch (error) {
        console.error("Message POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const after = searchParams.get("after");

        // Verify user is a member
        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select("id, members, host_id")
            .eq("id", id)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const isMember = (room.members || []).some((m: any) => m.user_id === user.id);
        if (!isMember && room.host_id !== user.id) {
            return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
        }

        // Get messages after timestamp
        let query = supabase
            .from("room_messages")
            .select(`
                *,
                user:profiles!user_id(id, username, first_name, avatar_url)
            `)
            .eq("room_id", id)
            .order("created_at", { ascending: true });

        if (after) {
            query = query.gt("created_at", after);
        }

        const { data: messages, error: messagesError } = await query.limit(50);

        if (messagesError) {
            return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            messages: messages?.map(m => ({
                id: m.id,
                content: m.content,
                type: m.message_type,
                createdAt: m.created_at,
                user: m.user ? {
                    id: m.user.id,
                    name: m.user.username || m.user.first_name || 'Unknown',
                    avatar: m.user.avatar_url
                } : null
            }))
        });
    } catch (error) {
        console.error("Messages GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
