// A simplified wrapper around Web Crypto API to demonstrate the concepts
// In a production app, this would handle key rotation, signal protocol ratchets, etc.

export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(exportedPublic),
    privateKey: arrayBufferToBase64(exportedPrivate),
  };
};

export const generateFingerprint = async (publicKeyBase64: string): Promise<string> => {
  const data = base64ToArrayBuffer(publicKeyBase64);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.substring(0, 12).toUpperCase(); // First 12 chars as ID
};

// Simulation of rotating code generation based on PubKey + Date
export const generateDailyLinkCode = async (publicKeyBase64: string): Promise<string> => {
    // Current date bucket (changes every 24h)
    const dateBucket = new Date().toISOString().split('T')[0];
    const encoder = new TextEncoder();
    const data = encoder.encode(publicKeyBase64 + dateBucket);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    
    // Convert to a friendly 4-word code or alphanumeric string
    // For this UI, we'll use a 6-char alphanum string for ease of typing
    const hashArray = Array.from(new Uint8Array(hash));
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
    let code = "";
    for(let i=0; i<8; i++) { // 8 char code
        code += chars[hashArray[i] % chars.length];
        if (i === 3) code += "-";
    }
    return code;
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}