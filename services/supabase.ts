import { createClient } from '@supabase/supabase-js';

// Credentials provided by user. 
// Ideally these should be in .env files as VITE_SUPABASE_URL and VITE_SUPABASE_KEY

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
