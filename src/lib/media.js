import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

const BUCKET = "chat-media";

/**
 * Uploads a file to Supabase Storage under chat-media/{conversationId}/{uuid}.{ext}
 * Returns the public URL.
 *
 * @param {File}   file
 * @param {string} conversationId
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, mimeType: string }>}
 */
export async function uploadMedia(file, conversationId) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const safeFileName = `${uuidv4()}.${ext}`;
  const path = `${conversationId}/${safeFileName}`;

  // Use upsert: true to avoid 409 conflicts if the same UUID already exists
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[uploadMedia] Storage upload error:", uploadError);
    throw new Error(uploadError.message || "Failed to upload media file.");
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!publicData?.publicUrl) {
    throw new Error("Could not retrieve public URL for uploaded file.");
  }

  return {
    url: publicData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

/**
 * Derives the message type from a MIME type string.
 * Maps to the message_type enum in the DB: text|image|video|audio|document|sticker|gif|location|contact|system
 * @param {string} mimeType
 * @returns {'image'|'video'|'audio'|'document'|'gif'}
 */
export function getMediaMessageType(mimeType) {
  if (!mimeType) return "document";
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

/**
 * Formats bytes into human-readable size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
