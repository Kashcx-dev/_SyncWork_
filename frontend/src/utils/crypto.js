// ─── SyncWork Crypto Engine ───
// Uses a custom C++ WebAssembly binary for Diffie-Hellman modular exponentiation
// and Web Crypto API (AES-256-GCM) for message encryption/decryption

// Default primes for Diffie-Hellman (must be BigInts for Wasm)
const BASE = BigInt(import.meta.env.VITE_BASE || 19);
const MODULUS = BigInt(import.meta.env.VITE_MODULUS || 4294967291);

let wasmModulation = null;

export async function initCryptoEngine() {
    if (wasmModulation) return true; // Already loaded

    try {
        const response = await fetch('/math_engine.wasm');
        const bytes = await response.arrayBuffer();
        const wasmModule = await WebAssembly.instantiate(bytes);
        wasmModulation = wasmModule.instance.exports.modulation;
        console.log("Wasm Crypto Engine loaded successfully!");
        return true;
    } catch (err) {
        console.error('Failed to load Wasm Engine:', err);
        return false;
    }
}

export function generateRandomPrivateKey() {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    return BigInt(randomNum);
}

export function getPublicKey(privateKeyBigInt) {
    if (!wasmModulation) throw new Error("Wasm engine not initialized!");
    const pubKeyBigInt = wasmModulation(BASE, privateKeyBigInt, MODULUS);
    return pubKeyBigInt.toString();
}

export function calculateSharedSecret(otherPublicKeyString, myPrivateKeyBigInt) {
    if (!wasmModulation) throw new Error("Wasm engine not initialized!");
    const otherPubKey = BigInt(otherPublicKeyString);
    const sharedSecret = wasmModulation(otherPubKey, myPrivateKeyBigInt, MODULUS);
    return sharedSecret.toString();
}

// ─── AES-256-GCM Helpers ───

async function deriveKeyFromPassword(password, saltUint8) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltUint8, iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

function bufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

function base64ToBuffer(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

// ─── Private Key Vault (encrypt/decrypt private key with user's password) ───

export async function encryptPrivateKeyForVault(privateKeyString, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveKeyFromPassword(password, salt);

    const encodedData = new TextEncoder().encode(privateKeyString);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, aesKey, encodedData
    );

    return {
        encrypted_private_key: bufferToBase64(encryptedBuffer),
        key_salt: bufferToBase64(salt),
        key_iv: bufferToBase64(iv)
    };
}

export async function decryptPrivateKeyFromVault(vault, password) {
    try {
        const salt = base64ToBuffer(vault.key_salt);
        const iv = base64ToBuffer(vault.key_iv);
        const encryptedBuffer = base64ToBuffer(vault.encrypted_private_key);

        const aesKey = await deriveKeyFromPassword(password, new Uint8Array(salt));
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) }, aesKey, encryptedBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        throw new Error("Failed to decrypt vault. Incorrect password?");
    }
}

// ─── Message Encryption/Decryption ───

export async function deriveMessageKey(sharedSecretString) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", encoder.encode(sharedSecretString), { name: "PBKDF2" }, false, ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new TextEncoder().encode("syncwork-chat"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

export async function encryptMessage(plainText, sharedSecretString) {
    const aesKey = await deriveMessageKey(sharedSecretString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, aesKey, encodedData
    );

    return JSON.stringify({
        iv: bufferToBase64(iv),
        ct: bufferToBase64(encryptedBuffer)
    });
}

export async function decryptMessage(encryptedJsonString, sharedSecretString) {
    let payload;
    try {
        payload = JSON.parse(encryptedJsonString);
    } catch (e) {
        return encryptedJsonString; // Not encrypted, return as-is
    }

    try {
        if (!payload.iv || !payload.ct) return encryptedJsonString;

        const aesKey = await deriveMessageKey(sharedSecretString);
        const iv = base64ToBuffer(payload.iv);
        const encryptedBuffer = base64ToBuffer(payload.ct);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) }, aesKey, encryptedBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        console.error("Decryption failed", err);
        return "[Encrypted Message]";
    }
}
