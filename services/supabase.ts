
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
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) throw error;
};

export const registerWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error", error);
};

// --- DATABASE (PROFILES) ---

export const saveUserToSupabase = async (userId: string, data: Partial<UserProfile>) => {
    const payload: any = { ...data };
    
    // Check if user exists
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
    
    if (existing) {
        await supabase.from('profiles').update(payload).eq('id', userId);
    } else {
        await supabase.from('profiles').insert([{ id: userId, ...payload }]);
    }
};

export const updateUserUsage = async (userId: string, usage: number) => {
    await supabase.from('profiles').update({ daily_quizzes_generated: usage }).eq('id', userId);
};

export const updateUserPlan = async (userId: string, newPlan: SubscriptionTier) => {
    await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId);
};

// --- SHARING SYSTEM ---

export const createShareLink = async (type: 'EXAM' | 'PROFESSOR', title: string, data: any): Promise<string | null> => {
    try {
        const { data: shareData, error } = await supabase.from('public_shares').insert([{
            type,
            title,
            data
        }]).select('id').single();

        if (error) {
            console.error("Share creation failed:", error);
            // This usually fails due to RLS if not logged in or policy restriction
            // We return null so the UI can handle it gracefully
            return null;
        }
        return shareData.id;
    } catch(e) {
        console.error("Failed to share:", e);
        return null;
    }
};

export const getShareData = async (id: string) => {
    const { data, error } = await supabase.from('public_shares').select('*').eq('id', id).single();
    if (error) return null;
    return data;
};

// --- DUEL SYSTEM (ARENA) ---

export const initDuelLobby = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig): Promise<{ duelId: string, code: string }> => {
    const ADJ = ["IRON", "NEON", "CYBER", "VOID", "AZURE", "SOLAR", "LUNAR", "HYPER", "DARK", "SILENT", "CRIMSON", "GOLDEN", "FROZEN", "TOXIC", "RAPID"];
    const NOUN = ["TIGER", "WOLF", "EAGLE", "STORM", "VORTEX", "CORE", "FLAME", "SHARD", "TITAN", "GHOST", "DRAGON", "PHANTOM", "VIPER", "HAWK", "RAVEN"];
    
    // Append 4 random digits to ensure uniqueness
    const suffix = Math.floor(1000 + Math.random() * 9000); 
    const code = `${ADJ[Math.floor(Math.random()*ADJ.length)]}-${NOUN[Math.floor(Math.random()*NOUN.length)]}-${suffix}`;

    const participants: DuelParticipant[] = [{ id: hostId, name: hostName, status: 'JOINED' }];
    
    const { data, error } = await supabase.from('duels').insert([{
        code,
        host_id: hostId,
        participants, // JSONB
        wager,
        content,
        quiz_config: quizConfig,
        status: 'INITIALIZING'
    }]).select().single();

    if (error) throw error;
    return { duelId: data.id, code };
};

export const updateDuelWithQuestions = async (duelId: string, questions: QuizQuestion[]) => {
    await supabase.from('duels').update({
        quiz_questions: questions,
        status: 'WAITING'
    }).eq('id', duelId);
};

export const joinDuelByCode = async (code: string, userId: string, userName: string): Promise<string> => {
    // 1. Find Duel
    const { data: duels, error } = await supabase.from('duels')
        .select('*')
        .eq('code', code.toUpperCase())
        .in('status', ['INITIALIZING', 'WAITING']);
        
    if (error || !duels || duels.length === 0) throw new Error("Arena not found or active.");
    
    const duel = duels[0];
    const participants = duel.participants as DuelParticipant[];
    
    // Check if already joined
    if (participants.some(p => p.id === userId)) return duel.id;
    
    // Check capacity (Hard limit 30 based on new modal requirement)
    if (participants.length >= 30) throw new Error("Arena is full.");

    // Add participant
    const newParticipant: DuelParticipant = { id: userId, name: userName, status: 'JOINED' };
    const updatedParticipants = [...participants, newParticipant];
    
    await supabase.from('duels').update({ participants: updatedParticipants }).eq('id', duel.id);
    return duel.id;
};

export const subscribeToDuel = (duelId: string, onUpdate: (data: DuelState) => void) => {
    const channel = supabase.channel(`duel:${duelId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, (payload) => {
            const d = payload.new;
            const mapped: DuelState = {
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
            };
            onUpdate(mapped);
        })
        .subscribe();

    supabase.from('duels').select('*').eq('id', duelId).single().then(({ data }) => {
        if (data) {
            const mapped: DuelState = {
                id: data.id,
                code: data.code,
                hostId: data.host_id,
                participants: data.participants,
                wager: data.wager,
                content: data.content,
                quizConfig: data.quiz_config,
                quizQuestions: data.quiz_questions,
                status: data.status,
                winnerId: data.winner_id,
                suddenDeathQuestion: data.sudden_death_question,
                createdAt: new Date(data.created_at).getTime()
            };
            onUpdate(mapped);
        }
    });

    return () => { supabase.removeChannel(channel); };
};

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    const { data, error } = await supabase.from('duels').select('*').eq('id', duelId).single();
    if (error || !data) return null;
    return {
        id: data.id,
        code: data.code,
        hostId: data.host_id,
        participants: data.participants,
        wager: data.wager,
        content: data.content,
        quizConfig: data.quiz_config,
        quizQuestions: data.quiz_questions,
        status: data.status,
        winnerId: data.winner_id,
        suddenDeathQuestion: data.sudden_death_question,
        createdAt: new Date(data.created_at).getTime()
    };
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
    await supabase.from('duels').update({
        status: 'SUDDEN_DEATH_ACTIVE',
        sudden_death_question: question
    }).eq('id', duelId);
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

export const adminUpdateUser = async (userId: string, data: Partial<UserProfile>) => {
    await supabase.from('profiles').update(data).eq('id', userId);
};
