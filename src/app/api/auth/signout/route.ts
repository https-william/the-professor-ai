import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Call signOut to explicitly remove the server-side session cookies.
    await supabase.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
}
