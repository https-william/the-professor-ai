
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// Credentials
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

// --- SHARE LINKS ---
export const createShareLink = async (type: 'EXAM' | 'PROFESSOR', data: any): Promise<string | null> => {
    try {
        const { data: shareData, error } = await supabase
            .from('public_shares') // Ensure you create this table if using sharing
            .insert([{ type, data }])
            .select('id')
            .single();
        if (error) return null;
        return shareData.id;
    } catch (e) {
        return null;
    }
};

export const getShareLink = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('public_shares')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data;
    } catch (e) {
        return null;
    }
};

// --- AUTHENTICATION ---

export const signUpUser = async (email: string, password: string, alias: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { alias } // Metadata triggers profile creation
        }
    });
    if (error) throw error;
    return data;
};

export const signInUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
    return data;
};

export const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/auth?type=recovery',
    });
    if (error) throw error;
};

// --- USER PROFILE ---

export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
    if (error) return null;
    return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
        
    if (error) console.error("Profile Update Failed", error);
};

// --- ADMIN & SYSTEM ---

export const fetchAllUsers = async () => {
    // In Supabase, standard users can't list all users from auth.users for security.
    // We query the 'profiles' table instead.
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const fetchAnnouncements = async () => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    if (error) return [];
    return data;
};

export const sendAnnouncement = async (title: string, message: string) => {
    const { error } = await supabase
        .from('announcements')
        .insert([{ title, message }]);
    if (error) throw error;
};

export const adminUpdateProfile = async (userId: string, updates: any) => {
    // RLS Policy must allow this, or be run by service role (not available in client)
    // For now, this assumes the user is updating themselves or RLS is open for testing
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    if (error) throw error;
};
