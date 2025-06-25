import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or anon key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Helper function to get the correct redirect URL
export const getRedirectURL = () => {
  if (typeof window !== 'undefined') {
    console.log('window.location.origin', window.location.origin);
    return window.location.origin;
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('process.env.NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL);
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
};