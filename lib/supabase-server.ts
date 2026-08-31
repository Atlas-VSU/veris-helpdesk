import { createClient } from "@supabase/supabase-js";

let supabaseServerClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServerClient() {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing required env vars: SUPABASE_URL and/or SUPABASE_SECRET_KEY",
    );
  }

  supabaseServerClient = createClient(supabaseUrl, supabaseSecretKey);
  return supabaseServerClient;
}
