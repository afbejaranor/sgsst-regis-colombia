import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_KEY"];

if (!rawUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
}

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
