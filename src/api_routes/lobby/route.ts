export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, room_type = 'study_group', description, is_public = true, max_members = 10, shared_content } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: "Room name must be at least 2 characters" }, { status: 400 });
        }

        // Generate unique code
        let code: string = '';
        let codeExists = true;
        while (codeExists) {
            code = generateCode();
            const { data: existing } = await supabase
                .from("lobby_rooms")
                .select("id")
                .eq("code", code)
                .single();
            codeExists = !!existing;
        }

        // Get user profile for host info
        const { data: profile } = await supabase
            .from("profiles")
            .select("username, first_name, avatar_url")
            .eq("id", user.id)
            .single();

        const members = [{
            user_id: user.id,
            name: profile?.username || profile?.first_name || 'You',
            avatar: profile?.avatar_url,
            joined_at: new Date().toISOString(),
            is_host: true
        }];

        const { data: room, error: roomError } = await supabase
            .from("lobby_rooms")
            .insert({
                code,
                host_id: user.id,
                name: name.trim(),
                room_type,
                description: description?.trim(),
                is_public,
                max_members,
                members,
                shared_content
            })
            .select()
            .single();

        if (roomError) {
            console.error("Room creation error:", roomError);
            return NextResponse.json({ 
                success: false,
                error: "Failed to create room",
                details: roomError.message
            }, { status: 500 });
        }

        console.log("Room created successfully:", room);

        // Add system message
        await supabase
            .from("room_messages")
            .insert({
                room_id: room.id,
                user_id: user.id,
                content: `${profile?.username || profile?.first_name || 'Host'} created the room`,
                message_type: 'system'
            });

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                roomType: room.room_type,
                isPublic: room.is_public,
                members: room.members,
                createdAt: room.created_at
            }
        });
    } catch (error) {
        console.error("Lobby POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const publicRooms = searchParams.get("public") === "true";
        const myRooms = searchParams.get("my") === "true";

        if (code) {
            // Join room by code
            const { data: room, error: roomError } = await supabase
                .from("lobby_rooms")
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, avatar_url)
                `)
                .eq("code", code.toUpperCase())
                .single();

            if (roomError || !room) {
                return NextResponse.json({ error: "Room not found" }, { status: 404 });
            }

            // Check if user is already a member
            const currentMembers = room.members || [];
            const isMember = currentMembers.some((m: any) => m.user_id === user.id);

            if (isMember) {
                return NextResponse.json({
                    success: true,
                    room: {
                        id: room.id,
                        code: room.code,
                        name: room.name,
                        roomType: room.room_type,
                        description: room.description,
                        isPublic: room.is_public,
                        members: room.members,
                        sharedContent: room.shared_content,
                        isMember: true,
                        isHost: room.host_id === user.id,
                        host: {
                            id: room.host?.id,
                            name: room.host?.username || room.host?.first_name || 'Host'
                        }
                    }
                });
            }

            // Check if room is full
            if (currentMembers.length >= room.max_members) {
                return NextResponse.json({ error: "Room is full" }, { status: 400 });
            }

            // Get user profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("username, first_name, avatar_url")
                .eq("id", user.id)
                .single();

            // Add user to members
            const newMember = {
                user_id: user.id,
                name: profile?.username || profile?.first_name || 'Guest',
                avatar: profile?.avatar_url,
                joined_at: new Date().toISOString(),
                is_host: false
            };

            const updatedMembers = [...currentMembers, newMember];

            await supabase
                .from("lobby_rooms")
                .update({ members: updatedMembers })
                .eq("id", room.id);

            // Add system message
            await supabase
                .from("room_messages")
                .insert({
                    room_id: room.id,
                    user_id: user.id,
                    content: `${profile?.username || profile?.first_name || 'Guest'} joined the room`,
                    message_type: 'system'
                });

            return NextResponse.json({
                success: true,
                room: {
                    id: room.id,
                    code: room.code,
                    name: room.name,
                    roomType: room.room_type,
                    description: room.description,
                    isPublic: room.is_public,
                    members: updatedMembers,
                    sharedContent: room.shared_content,
                    isMember: true,
                    isHost: false,
                    host: {
                        id: room.host?.id,
                        name: room.host?.username || room.host?.first_name || 'Host'
                    }
                }
            });
        }

        if (publicRooms) {
            // Get public rooms
            const { data: rooms, error: roomsError } = await supabase
                .from("lobby_rooms")
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, avatar_url)
                `)
                .eq("is_public", true)
                .gt("expires_at", new Date().toISOString())
                .order("created_at", { ascending: false })
                .limit(20);

            if (roomsError) {
                return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                rooms: rooms?.map(r => ({
                    id: r.id,
                    code: r.code,
                    name: r.name,
                    roomType: r.room_type,
                    description: r.description,
                    memberCount: (r.members || []).length,
                    maxMembers: r.max_members,
                    host: {
                        id: r.host?.id,
                        name: r.host?.username || r.host?.first_name || 'Host'
                    },
                    createdAt: r.created_at
                }))
            });
        }

        if (myRooms) {
            // Get user's rooms
            const { data: rooms, error: myRoomsError } = await supabase
                .from("lobby_rooms")
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, avatar_url)
                `)
                .eq("host_id", user.id)
                .gt("expires_at", new Date().toISOString())
                .order("created_at", { ascending: false });

            if (myRoomsError) {
                return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                rooms: rooms?.map(r => ({
                    id: r.id,
                    code: r.code,
                    name: r.name,
                    roomType: r.room_type,
                    description: r.description,
                    memberCount: (r.members || []).length,
                    maxMembers: r.max_members,
                    isHost: true,
                    host: {
                        id: r.host?.id,
                        name: r.host?.username || r.host?.first_name || 'You'
                    },
                    createdAt: r.created_at
                }))
            });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Lobby GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
