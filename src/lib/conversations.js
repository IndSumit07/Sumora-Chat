import { createClient } from "@/lib/supabase/client";
import { generateKeyPair, encryptKeyForUser } from "@/lib/crypto";

/**
 * Gets or creates a DM conversation between the current user and another user.
 * Generates a fresh AES-GCM conversation key and encrypts it per-participant.
 *
 * @param {string} otherUserId
 * @returns {Promise<string>} conversationId
 */
export async function getOrCreateDM(otherUserId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Call RPC to get or create the DM conversation
  const { data: convId, error: rpcError } = await supabase.rpc(
    "get_or_create_dm",
    { other_user_id: otherUserId },
  );
  if (rpcError) throw rpcError;

  // 2. Check if keys are already set (avoid re-keying existing DMs)
  const { data: myParticipant } = await supabase
    .from("conversation_participants")
    .select("encrypted_key")
    .eq("conversation_id", convId)
    .eq("user_id", user.id)
    .single();

  if (myParticipant?.encrypted_key) {
    // Keys already established — return conversation ID as-is
    return convId;
  }

  // 3. Fetch both users' public keys
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, public_key")
    .in("id", [user.id, otherUserId]);

  if (profileError) throw profileError;

  const myProfile = profiles.find((p) => p.id === user.id);
  const theirProfile = profiles.find((p) => p.id === otherUserId);

  if (!myProfile?.public_key || !theirProfile?.public_key) {
    throw new Error("One or both users have not completed key setup");
  }

  // 4. Generate fresh AES-256-GCM conversation key
  const convKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can export+encrypt for each participant
    ["encrypt", "decrypt"],
  );

  // 5. Encrypt conversation key for each participant using ECDH
  // Since DH(my_priv, their_pub) == DH(their_priv, my_pub),
  // we derive the same shared wrapping key for both participants.
  const encryptedKeyForBoth = await encryptKeyForUser(
    convKey,
    theirProfile.public_key,
    user.id,
  );
  const myEncryptedKey = encryptedKeyForBoth;
  const theirEncryptedKey = encryptedKeyForBoth;

  // 6. Persist encrypted keys into conversation_participants
  const { error: updateError } = await supabase.rpc("set_dm_keys", {
    p_conv_id: convId,
    p_my_key: myEncryptedKey,
    p_their_key: theirEncryptedKey,
    p_other_user_id: otherUserId,
  });

  if (updateError) throw updateError;

  return convId;
}
