// This file is updated to use environment variables for Vercel/Local deployment.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Supabase credentials missing. Check your .env file or Vercel environment variables.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(SUPABASE_URL || "", SUPABASE_PUBLISHABLE_KEY || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});