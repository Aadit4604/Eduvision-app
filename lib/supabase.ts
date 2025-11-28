import { createClient } from '@supabase/supabase-js';

// NOTE TO USER: 
// To enable Supabase features (Login, Global Leaderboard, Cloud Sync):
// 1. Create a project at https://supabase.com
// 2. Run the SQL Schema provided in the instructions.
// 3. Add your keys below.

// Configuration with provided keys
const supabaseUrl = 'https://cstdffslbethewanmnpw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdGRmZnNsYmV0aGV3YW5tbnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTA4NjUsImV4cCI6MjA3OTgyNjg2NX0.WLKokR9z14XkXEsHoroHHu7bk8GWf6htjhWxQKx1LFs';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Helper to check if Supabase is active
export const isSupabaseEnabled = () => !!supabase;

// Helper to get Leaderboard
export const getLeaderboard = async () => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('scores')
        .select('username, score, game_mode, created_at')
        .order('score', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
    return data;
};

// Helper to save score
export const saveScoreToCloud = async (userId: string, username: string, score: number, gameMode: string = 'quiz') => {
    if (!supabase) return;
    
    const { error } = await supabase
        .from('scores')
        .insert([{ user_id: userId, username, score, game_mode: gameMode }]);

    if (error) console.error("Error saving score:", error);
};

// Helper to update profile XP
export const updateUserXP = async (userId: string, xpToAdd: number) => {
    if (!supabase) return;

    // First get current XP
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', userId)
        .single();
    
    const currentXP = profile?.total_xp || 0;
    const newXP = currentXP + xpToAdd;

    const { error } = await supabase
        .from('profiles')
        .update({ total_xp: newXP })
        .eq('id', userId);

    if (error) console.error("Error updating XP:", error);
    return newXP;
};