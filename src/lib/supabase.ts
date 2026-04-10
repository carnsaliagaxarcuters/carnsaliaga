import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://naejaecfhgbdcprnhjzp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZWphZWNmaGdiZGNwcm5oanpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDc3MTQsImV4cCI6MjA5MTIyMzcxNH0.Gct3kkrmvzIXANuvU8xV9DvnZS7GMcfW0Qzk8wlc_HA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
