import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

let supabaseServerClient: ReturnType<typeof createClient<Database>> | null = null;

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

  supabaseServerClient = createClient<Database>(supabaseUrl, supabaseSecretKey);
  return supabaseServerClient;
}

export async function getAttachmentSignedUrl(storagePath: string, expiresIn = 3600) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
