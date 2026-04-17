import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

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

        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, avatar_url)
            `)
            .eq("id", id)
            .single();

        if (roomError || !room) {
            console.error("Room fetch error:", roomError);
            return NextResponse.json({ 
                success: false,
                error: "Room not found",
                details: roomError?.message
            }, { status: 404 });
        }

        console.log("Room found:", room);

        // Check if user is a member
        const isMember = (room.members || []).some((m: any) => m.user_id === user.id);

        if (!isMember && !room.is_public) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get recent messages
        const { data: messages } = await supabase
            .from("room_messages")
            .select(`
                *,
                user:profiles!user_id(id, username, first_name, avatar_url)
            `)
            .eq("room_id", id)
            .order("created_at", { ascending: true })
            .limit(100);

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
                members: room.members,
                sharedContent: room.shared_content,
                isMember,
                isHost: room.host_id === user.id,
                host: {
                    id: room.host?.id,
                    name: room.host?.username || room.host?.first_name || 'Host'
                },
                createdAt: room.created_at
            },
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
        console.error("Room GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
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
        const { action, ...data } = body;

        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select("*")
            .eq("id", id)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        switch (action) {
            case 'leave': {
                // Remove user from members
                const updatedMembers = (room.members || []).filter((m: any) => m.user_id !== user.id);
                
                await supabase
                    .from("lobby_rooms")
                    .update({ members: updatedMembers })
                    .eq("id", id);

                await supabase
                    .from("room_messages")
                    .insert({
                        room_id: id,
                        user_id: user.id,
                        content: 'Left the room',
                        message_type: 'system'
                    });

                return NextResponse.json({ success: true });
            }

            case 'share_content': {
                // Only members can share content
                const isMember = (room.members || []).some((m: any) => m.user_id === user.id);
                if (!isMember && room.host_id !== user.id) {
                    return NextResponse.json({ error: "Must be a member" }, { status: 403 });
                }

                await supabase
                    .from("lobby_rooms")
                    .update({ shared_content: data.content })
                    .eq("id", id);

                await supabase
                    .from("room_messages")
                    .insert({
                        room_id: id,
                        user_id: user.id,
                        content: 'Shared a resource',
                        message_type: 'content_share'
                    });

                return NextResponse.json({ success: true });
            }

            case 'update_settings': {
                // Only host can update settings
                if (room.host_id !== user.id) {
                    return NextResponse.json({ error: "Only host can update settings" }, { status: 403 });
                }

                const allowedUpdates: any = {};
                if (data.name) allowedUpdates.name = data.name.trim();
                if (data.description !== undefined) allowedUpdates.description = data.description?.trim();
                if (data.is_public !== undefined) allowedUpdates.is_public = data.is_public;
                if (data.max_members) allowedUpdates.max_members = data.max_members;

                await supabase
                    .from("lobby_rooms")
                    .update(allowedUpdates)
                    .eq("id", id);

                return NextResponse.json({ success: true });
            }

            case 'kick': {
                // Only host can kick
                if (room.host_id !== user.id) {
                    return NextResponse.json({ error: "Only host can kick members" }, { status: 403 });
                }

                const targetUserId = data.user_id;
                if (!targetUserId) {
                    return NextResponse.json({ error: "User ID required" }, { status: 400 });
                }

                if (targetUserId === user.id) {
                    return NextResponse.json({ error: "Cannot kick yourself" }, { status: 400 });
                }

                const updatedMembers = (room.members || []).filter((m: any) => m.user_id !== targetUserId);
                
                await supabase
                    .from("lobby_rooms")
                    .update({ members: updatedMembers })
                    .eq("id", id);

                await supabase
                    .from("room_messages")
                    .insert({
                        room_id: id,
                        user_id: targetUserId,
                        content: 'Was removed from the room',
                        message_type: 'system'
                    });

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Room PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
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

        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .select("host_id")
            .eq("id", id)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Only host can delete
        if (room.host_id !== user.id) {
            return NextResponse.json({ error: "Only host can delete room" }, { status: 403 });
        }

        // Delete room (cascades to messages)
        await supabase
            .from("lobby_rooms")
            .delete()
            .eq("id", id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Room DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
