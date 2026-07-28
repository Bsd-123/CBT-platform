import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/db/config";

/** Browser-side Supabase client (Auth, Realtime). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
