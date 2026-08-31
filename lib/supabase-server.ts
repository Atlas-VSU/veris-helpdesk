import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

    return createClient (supabaseUrl, supabaseSecretKey);
}