import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/db/config";
import { supabaseFetch } from "@/lib/supabase/fetch";

/** Server-side Supabase client with cookie-based session handling. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    global: {
      fetch: supabaseFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll: ((cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail in Server Components; middleware handles refresh.
        }
      }) satisfies SetAllCookies,
    },
  });
}
