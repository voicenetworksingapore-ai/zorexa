import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser Supabase client. Uses cookies so middleware can read the session. */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);