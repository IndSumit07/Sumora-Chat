// E2E Encryption using Web Crypto API (window.crypto.subtle)
// Rules: NEVER log decrypted content, NEVER store private keys outside IndexedDB
import { savePrivateKey, loadPrivateKey } from "@/lib/keyStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── TASK 1: generateKeyPair ──────────────────────────────────────────────────

/**
 * Generates an ECDH P-256 key pair, saves private key to IndexedDB,
 * returns base64-encoded SPKI public key.
 * @param {string} userId
 * @returns {Promise<string>} base64 public key (SPKI)
 */
export async function generateKeyPair(userId) {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false, // private key is NOT extractable
    ["deriveKey", "deriveBits"],
  );

  // Save private key to IndexedDB ONLY — never to state/localStorage
  await savePrivateKey(userId, keyPair.privateKey);

  // Export public key in SPKI format → base64
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );

  return bufferToBase64(publicKeyBuffer);
}

// ─── TASK 2: encryptMessage ───────────────────────────────────────────────────

/**
 * Encrypts a plaintext string using AES-GCM with a random 12-byte IV.
 * @param {string} plaintext
 * @param {CryptoKey} conversationKey  AES-GCM CryptoKey
 * @returns {Promise<{ encryptedContent: string, iv: string }>}
 */
export async function encryptMessage(plaintext, conversationKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    conversationKey,
    encoder.encode(plaintext),
  );

  return {
    encryptedContent: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

// ─── TASK 3: decryptMessage ───────────────────────────────────────────────────

/**
 * Decrypts an AES-GCM encrypted message.
 * @param {string} encryptedContent  base64 ciphertext
 * @param {string} ivBase64          base64 IV
 * @param {CryptoKey} conversationKey
 * @returns {Promise<string>} plaintext
 */
export async function decryptMessage(
  encryptedContent,
  ivBase64,
  conversationKey,
) {
  const decoder = new TextDecoder();
  const iv = new Uint8Array(base64ToBuffer(ivBase64));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    conversationKey,
    base64ToBuffer(encryptedContent),
  );

  return decoder.decode(decryptedBuffer);
}

// ─── TASK 4: encryptKeyForUser ────────────────────────────────────────────────

/**
 * Encrypts the conversation AES key for a specific recipient using ECDH.
 * Layout of output bytes: [12-byte IV | ciphertext]
 * @param {CryptoKey} convKey                  AES-GCM CryptoKey to wrap
 * @param {string}    recipientPublicKeyBase64  Recipient SPKI public key (base64)
 * @param {string}    myUserId                  Used to load my private key from IndexedDB
 * @returns {Promise<string>} base64 of [iv + encryptedKey]
 */
export async function encryptKeyForUser(
  convKey,
  recipientPublicKeyBase64,
  myUserId,
) {
  // Load my private key from IndexedDB
  const myPrivateKey = await loadPrivateKey(myUserId);
  if (!myPrivateKey)
    throw new Error("Private key not found in IndexedDB for user: " + myUserId);

  // Import recipient's public key from base64 SPKI
  const recipientPublicKey = await window.crypto.subtle.importKey(
    "spki",
    base64ToBuffer(recipientPublicKeyBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Derive ECDH shared AES-256-GCM wrapping key
  const sharedWrappingKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: recipientPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // Export the conversation key as raw bytes to encrypt
  const rawConvKeyBytes = await window.crypto.subtle.exportKey("raw", convKey);

  // Encrypt with random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedWrappingKey,
    rawConvKeyBytes,
  );

  // Concatenate: [12 IV bytes | encrypted key bytes]
  const combined = new Uint8Array(12 + encryptedKeyBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedKeyBuffer), 12);

  return bufferToBase64(combined.buffer);
}

// ─── TASK 5: decryptConversationKey ──────────────────────────────────────────

/**
 * Decrypts a conversation key encrypted by the sender using ECDH.
 * @param {string} encryptedKeyBase64     base64 of [iv + encryptedKey]
 * @param {string} senderPublicKeyBase64  Sender SPKI public key (base64)
 * @param {string} myUserId               Used to load my private key from IndexedDB
 * @returns {Promise<CryptoKey>} AES-GCM CryptoKey usable for decrypt
 */
export async function decryptConversationKey(
  encryptedKeyBase64,
  senderPublicKeyBase64,
  myUserId,
) {
  // Load my private key from IndexedDB
  const myPrivateKey = await loadPrivateKey(myUserId);
  if (!myPrivateKey)
    throw new Error("Private key not found in IndexedDB for user: " + myUserId);

  // Import sender's public key
  const senderPublicKey = await window.crypto.subtle.importKey(
    "spki",
    base64ToBuffer(senderPublicKeyBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Derive the same ECDH shared wrapping key
  const sharedWrappingKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: senderPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // Split [iv | encryptedKey]
  const combined = new Uint8Array(base64ToBuffer(encryptedKeyBase64));
  const iv = combined.slice(0, 12);
  const encryptedKeyBytes = combined.slice(12);

  // Decrypt to get raw conversation key bytes
  const rawConvKeyBytes = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedWrappingKey,
    encryptedKeyBytes,
  );

  // Import as an AES-GCM key usable for message decryption
  return window.crypto.subtle.importKey(
    "raw",
    rawConvKeyBytes,
    { name: "AES-GCM", length: 256 },
    false, // not extractable
    ["encrypt", "decrypt"],
  );
}
