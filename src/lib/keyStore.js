// IndexedDB key storage — private keys NEVER leave IndexedDB
const DB_NAME = "sumora_keys";
const STORE_NAME = "keypairs";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Persists a private CryptoKey into IndexedDB under key "private_{userId}".
 * @param {string} userId
 * @param {CryptoKey} cryptoKey
 */
export async function savePrivateKey(userId, cryptoKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(cryptoKey, `private_${userId}`);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Loads a private CryptoKey from IndexedDB.
 * @param {string} userId
 * @returns {Promise<CryptoKey|null>}
 */
export async function loadPrivateKey(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`private_${userId}`);
    request.onsuccess = (event) => resolve(event.target.result ?? null);
    request.onerror = (event) => reject(event.target.error);
    tx.oncomplete = () => db.close();
  });
}
