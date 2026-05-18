import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LS_KEY = "feature_active_salon_id";

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user) return null;

  // Respect active branch selected by user (multi-branch support)
  const activeSalonId =
    typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;

  let query = supabaseAdmin
    .from("salons")
    .select("*")
    .eq("owner_id", user.id);

  // If a specific branch is selected, filter to just that one
  if (activeSalonId) {
    query = query.eq("id", activeSalonId);
  }

  const { data: salon, error } = await query
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !salon) return null;

  return {
    user,
    salon,
    salon_id: salon.id,
  };
}