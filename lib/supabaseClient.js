import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
let cachedConfig = null;

async function fetchConfig() {
  if (cachedConfig) return cachedConfig;
  const res = await fetch("/server-config");
  cachedConfig = await res.json();
  return cachedConfig;
}

export async function getSupabase() {
  if (cachedClient) return cachedClient;
  const config = await fetchConfig();
  cachedClient = createClient(
    config.supabaseUrl || "https://placeholder.supabase.co",
    config.supabaseKey || "placeholder_key"
  );
  return cachedClient;
    }
