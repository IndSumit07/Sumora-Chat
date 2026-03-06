/**
 * Canonical Supabase client — ONE instance for the entire app.
 *
 * IMPORTANT: We intentionally re-export the same object created in
 * src/lib/supabase.js so that only ONE GoTrueClient ever exists in
 * the browser context.  Creating a second instance causes the auth
 * lock-stealing ("AbortError") observed in the console.
 */
export { supabase } from "@/lib/supabase";

/**
 * Named createClient() used by components that call createClient().
 * Always returns the single shared instance — never constructs a new one.
 */
export { supabase as default } from "@/lib/supabase";

import { supabase } from "@/lib/supabase";
export function createClient() {
  return supabase;
}
