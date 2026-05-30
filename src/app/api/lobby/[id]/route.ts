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

        // Fetch room
        let { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, avatar_url)
            `)
            .eq("id", roomId)
            .single();

        // Fallback manual profile fetch if relationship fails
        if (roomError && roomError.code === 'PGRST100') {
            const { data: baseRoom } = await supabase
                .from("lobby_rooms")
                .select("*")
                .eq("id", roomId)
                .single();

            if (baseRoom) {
                const { data: hostProfile } = await supabase
                    .from("profiles")
                    .select("id, username, first_name, avatar_url")
                    .eq("id", baseRoom.host_id)
                    .single();

                room = { ...baseRoom, host: hostProfile };
                roomError = null;
            }
        }

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const currentMembers = room.members || [];
        const isMember = currentMembers.some((m: any) => m.user_id === user.id);

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                roomType: room.room_type,
                description: room.description,
                isPublic: room.is_public,
                maxMembers: room.max_members,
                members: currentMembers,
                sharedContent: room.shared_content,
                isMember,
                isHost: room.host_id === user.id,
                host: {
                    id: room.host?.id || room.host_id,
                    name: room.host?.username || room.host?.first_name || 'Host'
                }
            }
        });
    } catch (error) {
        console.error("Lobby GET by ID Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
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
        const { action } = body;

        // Fetch room
        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select("*")
            .eq("id", roomId)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const currentMembers = room.members || [];
        const isMember = currentMembers.some((m: any) => m.user_id === user.id);

        if (!isMember) {
            return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
        }

        if (action === "leave") {
            const remainingMembers = currentMembers.filter((m: any) => m.user_id !== user.id);

            // Fetch user profile for system message name
            const { data: profile } = await supabase
                .from("profiles")
                .select("username, first_name")
                .eq("id", user.id)
                .single();
            const displayName = profile?.username || profile?.first_name || "Guest";

            if (remainingMembers.length === 0) {
                // Delete empty room
                await supabase
                    .from("lobby_rooms")
                    .delete()
                    .eq("id", roomId);

                return NextResponse.json({ success: true, roomDeleted: true });
            }

            let newHostId = room.host_id;
            if (room.host_id === user.id) {
                // Assign new host
                remainingMembers[0].is_host = true;
                newHostId = remainingMembers[0].user_id;

                // Add system message about host transfer
                await supabase
                    .from("room_messages")
                    .insert({
                        room_id: roomId,
                        user_id: user.id,
                        content: `Host ${displayName} left. Host ownership transferred to ${remainingMembers[0].name}.`,
                        message_type: 'system'
                    });
            } else {
                // Standard leave message
                await supabase
                    .from("room_messages")
                    .insert({
                        room_id: roomId,
                        user_id: user.id,
                        content: `${displayName} left the room`,
                        message_type: 'system'
                    });
            }

            // Update room
            await supabase
                .from("lobby_rooms")
                .update({
                    members: remainingMembers,
                    host_id: newHostId
                })
                .eq("id", roomId);

            return NextResponse.json({ success: true });
        }

        if (action === "share") {
            const { content } = body;

            if (!content || !content.id || !content.title || !content.type) {
                return NextResponse.json({ error: "Invalid content payload" }, { status: 400 });
            }

            // Update room
            await supabase
                .from("lobby_rooms")
                .update({ shared_content: content })
                .eq("id", roomId);

            // Fetch user profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("username, first_name")
                .eq("id", user.id)
                .single();
            const displayName = profile?.username || profile?.first_name || "Member";

            const typeLabel = content.type === 'quiz' ? 'quiz' : 
                              content.type === 'flashcards' ? 'flashcards deck' : 
                              content.type === 'summary' ? 'summary' : 'study pack';

            // Add system message
            await supabase
                .from("room_messages")
                .insert({
                    room_id: roomId,
                    user_id: user.id,
                    content: `${displayName} shared a ${typeLabel}: "${content.title}"`,
                    message_type: 'system'
                });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Lobby PATCH by ID Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
