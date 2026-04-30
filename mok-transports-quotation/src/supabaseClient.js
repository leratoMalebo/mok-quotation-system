import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────
// Replace these with your actual Supabase values
// OR set them as Vercel environment variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://xzyxoushcfjnmbttswgw.supabase.co";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXhvdXNoY2Zqbm1idHRzd2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTc1ODUsImV4cCI6MjA5MzA3MzU4NX0.-Vga2Yz8a07bG1dfzZUmcXjb-AsnUL3dhi-yoZnKun8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

