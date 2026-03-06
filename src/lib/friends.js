import { createClient } from "@/lib/supabase/client";

export async function searchUserByEmail(email) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_user_by_email", {
    search_email: email,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function addContact(contactUserId, contactName) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upsert contact so if it already exists it just updates the name
  const { error } = await supabase.from("contacts").upsert(
    {
      user_id: user.id,
      contact_user_id: contactUserId,
      contact_name: contactName,
    },
    { onConflict: "user_id,contact_user_id" },
  );

  if (error) throw error;
}

export async function getFriends() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select(
      `
      id,
      user_id,
      contact_user_id,
      contact_name,
      created_at
    `,
    )
    .eq("user_id", user.id);

  if (error) throw error;
  if (!contacts || contacts.length === 0) return [];

  const friendIds = contacts.map((c) => c.contact_user_id);

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_online, last_seen, public_key")
    .in("id", friendIds);

  if (profileError) throw profileError;

  return contacts.map((c) => {
    const profile = profiles.find((p) => p.id === c.contact_user_id) || {};
    return {
      id: c.id,
      friend: { ...profile, full_name: c.contact_name || profile.full_name },
      contact_name: c.contact_name,
    };
  });
}
