import { createClient } from "@/lib/supabase/client";

/**
 * Searches for a user by exact email address via a Supabase RPC.
 * The RPC should be: search_user_by_email(email text) → profiles row
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function searchUserByEmail(email) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_user_by_email", {
    search_email: email,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Sends a friend request from the current user to addresseeId.
 * @param {string} addresseeId  UUID of the target user
 */
export async function sendFriendRequest(addresseeId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (error) throw error;
}

/**
 * Accepts a pending friend request.
 * @param {string} friendshipId  UUID of the friendship row
 */
export async function acceptFriendRequest(friendshipId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  if (error) throw error;
}

/**
 * Rejects a pending friend request.
 * @param {string} friendshipId  UUID of the friendship row
 */
export async function rejectFriendRequest(friendshipId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("id", friendshipId);

  if (error) throw error;
}

/**
 * Returns all accepted friends of the current user, with their profile details.
 * @returns {Promise<Array>}
 */
export async function getFriends() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch friendships where I am requester OR addressee and status = accepted
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select(
      `
      id,
      requester_id,
      addressee_id,
      status,
      created_at
    `,
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (error) throw error;
  if (!friendships || friendships.length === 0) return [];

  // Collect friend UUIDs (the other person in each friendship)
  const friendIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id,
  );

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_online, last_seen, public_key")
    .in("id", friendIds);

  if (profileError) throw profileError;

  // Merge friendship metadata with profile data
  return friendships.map((f) => {
    const friendId =
      f.requester_id === user.id ? f.addressee_id : f.requester_id;
    const profile = profiles.find((p) => p.id === friendId);
    return { ...f, friend: profile };
  });
}
