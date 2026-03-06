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
  const ext = file.name.split(".").pop();
  const path = `${conversationId}/${uuidv4()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    url: publicData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/**
 * Derives the message type from a MIME type string.
 * @param {string} mimeType
 * @returns {'image'|'audio'|'document'}
 */
export function getMediaMessageType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * Formats bytes into human-readable size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
