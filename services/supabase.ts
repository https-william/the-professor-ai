import { createClient } from '@supabase/supabase-js';
import { UserProfile, SubscriptionTier, DuelState, QuizQuestion, QuizConfig, DuelParticipant, ProfessorSection } from '../types';

// ENV Vars
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        return import.meta.env[key];
    } catch {
        return undefined;
    }
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://hzdjctvkrsmtjqhndckk.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_KEY') || 'sb_publishable_2MW4JeHUX3sSpaJxTXQROg_VJY4S6-D';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- AUTHENTICATION ---

export const signInWithGoogle = async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    });
    if (error) throw error;
};

export const registerWithEmail = async (email: string, password: string, fullName?: string) => {
    // We pass metadata so the database trigger can use it immediately
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: fullName || email.split('@')[0],
                avatar_url: '',
            }
        }
    });
    if (error) throw error;
    return data;
};

export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const verifyUserOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
    });
    if (error) throw error;
    return data;
};

export const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    });
    if (error) throw error;
};

export const logout = async () => {
    await supabase.auth.signOut();
};

// --- DATABASE (PROFILES) ---

export const saveUserToSupabase = async (userId: string, data: Partial<UserProfile>) => {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
    if (existing) {
        await supabase.from('profiles').update(data).eq('id', userId);
    } else {
        await supabase.from('profiles').insert([{ id: userId, ...data }]);
    }
};

export const updateUserUsage = async (userId: string, usage: number) => {
    await supabase.from('profiles').update({ daily_quizzes_generated: usage }).eq('id', userId);
};

export const updateUserPlan = async (userId: string, newPlan: SubscriptionTier) => {
    await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId);
};

// --- STORAGE (AVATARS) ---

export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return null;
    }
};

// --- SHARING SYSTEM ---

export const createShareLink = async (type: 'EXAM' | 'PROFESSOR', title: string, data: any): Promise<string | null> => {
    try {
        const { data: shareData, error } = await supabase.from('public_shares').insert([{ type, title, data }]).select('id').single();
        if (error) return null;
        return shareData.id;
    } catch(e) { return null; }
};

export const getShareData = async (id: string) => {
    const { data, error } = await supabase.from('public_shares').select('*').eq('id', id).single();
    if (error) return null;
    return data;
};

// --- DUEL SYSTEM (REALTIME) ---

export const initDuelLobby = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig): Promise<{ duelId: string, code: string }> => {
    const ADJ = ["IRON", "NEON", "CYBER", "VOID", "AZURE"];
    const NOUN = ["TIGER", "WOLF", "EAGLE", "STORM", "VORTEX"];
    const suffix = Math.floor(1000 + Math.random() * 9000); 
    const code = `${ADJ[Math.floor(Math.random()*ADJ.length)]}-${NOUN[Math.floor(Math.random()*NOUN.length)]}-${suffix}`;

    const participants: DuelParticipant[] = [{ id: hostId, name: hostName, status: 'JOINED' }];
    
    const { data, error } = await supabase.from('duels').insert([{
        code, host_id: hostId, participants, wager, content, quiz_config: quizConfig, status: 'INITIALIZING'
    }]).select().single();

    if (error) throw error;
    return { duelId: data.id, code };
};

export const updateDuelWithQuestions = async (duelId: string, questions: QuizQuestion[]) => {
    await supabase.from('duels').update({ quiz_questions: questions, status: 'WAITING' }).eq('id', duelId);
};

export const joinDuelByCode = async (code: string, userId: string, userName: string): Promise<string> => {
    const { data: duels, error } = await supabase.from('duels').select('*').eq('code', code.toUpperCase()).in('status', ['INITIALIZING', 'WAITING']);
    if (error || !duels || duels.length === 0) throw new Error("Arena not found.");
    
    const duel = duels[0];
    const participants = duel.participants as DuelParticipant[];
    
    if (participants.some(p => p.id === userId)) return duel.id;
    if (participants.length >= 30) throw new Error("Arena is full.");

    const newParticipant: DuelParticipant = { id: userId, name: userName, status: 'JOINED' };
    await supabase.from('duels').update({ participants: [...participants, newParticipant] }).eq('id', duel.id);
    return duel.id;
};

export const subscribeToDuel = (duelId: string, onUpdate: (data: DuelState) => void) => {
    // Initial fetch
    supabase.from('duels').select('*').eq('id', duelId).single().then(({ data }) => {
        if (data) onUpdate(mapDuelState(data));
    });

    const channel = supabase.channel(`duel-${duelId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, (payload) => {
            onUpdate(mapDuelState(payload.new));
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

const mapDuelState = (d: any): DuelState => ({
    id: d.id,
    code: d.code,
    hostId: d.host_id,
    participants: d.participants,
    wager: d.wager,
    content: d.content,
    quizConfig: d.quiz_config,
    quizQuestions: d.quiz_questions,
    status: d.status,
    winnerId: d.winner_id,
    suddenDeathQuestion: d.sudden_death_question,
    createdAt: new Date(d.created_at).getTime()
});

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    const { data, error } = await supabase.from('duels').select('*').eq('id', duelId).single();
    if (error || !data) return null;
    return mapDuelState(data);
};

export const submitDuelScore = async (duelId: string, userId: string, score: number) => {
    const duel = await getDuel(duelId);
    if (!duel) return;
    
    const updatedParticipants = duel.participants.map(p => 
        p.id === userId ? { ...p, score, status: 'COMPLETED' as const } : p
    );
    
    let updateData: any = { participants: updatedParticipants };
    
    if (updatedParticipants.every(p => p.status === 'COMPLETED')) {
        const sorted = [...updatedParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
        // Check for tie
        if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
            updateData.status = 'SUDDEN_DEATH_PENDING';
        } else {
            updateData.status = 'COMPLETED';
            updateData.winner_id = sorted[0].id;
        }
    }
    
    await supabase.from('duels').update(updateData).eq('id', duelId);
};

export const activateSuddenDeath = async (duelId: string, question: QuizQuestion) => {
    await supabase.from('duels').update({ status: 'SUDDEN_DEATH_ACTIVE', sudden_death_question: question }).eq('id', duelId);
};

export const submitSuddenDeathAnswer = async (duelId: string, userId: string, isCorrect: boolean) => {
    const duel = await getDuel(duelId);
    if (!duel) return;
    const updatedParticipants = duel.participants.map(p => 
        p.id === userId ? { ...p, score: isCorrect ? (p.score || 0) + 1 : (p.score || 0), suddenDeathStatus: 'COMPLETED' as const } : p
    );
    
    let updateData: any = { participants: updatedParticipants };
    if (updatedParticipants.every(p => p.suddenDeathStatus === 'COMPLETED')) {
        updateData.status = 'COMPLETED';
        const sorted = [...updatedParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
        updateData.winner_id = sorted[0].id;
    }
    await supabase.from('duels').update(updateData).eq('id', duelId);
};

// --- THE HUB (REALTIME) ---

export const createHubRoom = async (hostAlias: string, modules: ProfessorSection[]): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from('hubs').insert({
        code, host: hostAlias, modules, participants: [hostAlias]
    }).select('id').single();
    if (error) throw error;
    return data.id;
};

export const joinHubRoom = async (code: string, userAlias: string): Promise<string> => {
    const { data: hubs, error } = await supabase.from('hubs').select('*').eq('code', code.toUpperCase());
    if (error || !hubs || hubs.length === 0) throw new Error("Room not found.");
    const room = hubs[0];
    
    const participants = room.participants || [];
    if (!participants.includes(userAlias)) {
        await supabase.from('hubs').update({ participants: [...participants, userAlias] }).eq('id', room.id);
    }
    return room.id;
};

export const sendHubMessage = async (roomId: string, sender: string, content: string, type: 'text' | 'audio' = 'text') => {
    await supabase.from('hub_messages').insert({ hub_id: roomId, sender, content, type });
};

// Realtime Chat + Typing Indicators + Presence
export const subscribeToHub = (
    roomId: string, 
    userAlias: string,
    onMessages: (msgs: any[]) => void,
    onTyping: (users: string[]) => void,
    onPresence: (users: string[]) => void
) => {
    // 1. Load existing messages
    supabase.from('hub_messages').select('*').eq('hub_id', roomId).order('created_at', { ascending: true })
        .then(({ data }) => { if (data) onMessages(data); });

    // 2. Setup Channel
    const channel = supabase.channel(`hub_room_${roomId}`, {
        config: { presence: { key: userAlias } }
    });

    // 3. Listen for new messages
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hub_messages', filter: `hub_id=eq.${roomId}` }, (payload) => {
        // Optimistic update or refetch? Refetch safer for order.
        supabase.from('hub_messages').select('*').eq('hub_id', roomId).order('created_at', { ascending: true })
            .then(({ data }) => { if (data) onMessages(data); });
    });

    // 4. Listen for Broadcasts (Typing)
    const typingUsers = new Set<string>();
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user !== userAlias) {
            typingUsers.add(payload.user);
            onTyping(Array.from(typingUsers));
            // Clear after 3 seconds
            setTimeout(() => {
                typingUsers.delete(payload.user);
                onTyping(Array.from(typingUsers));
            }, 3000);
        }
    });

    // 5. Presence (Who is online)
    channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        onPresence(users);
    });

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
        }
    });

    return {
        unsubscribe: () => supabase.removeChannel(channel),
        sendTyping: () => channel.send({ type: 'broadcast', event: 'typing', payload: { user: userAlias } })
    };
};

// --- ADMIN OPS ---

export const getAllData = async (table: string) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return [];
    return data;
};

export const deleteUserAccount = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
};

export const toggleBanUser = async (userId: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
};
