/**
 * Crypto utility for encrypting and decrypting sensitive data
 * Uses AES-GCM encryption with a derived key from a passphrase
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Generate a cryptographic key from a passphrase
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        passphraseKey,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate a device-specific passphrase
 * Uses stable values that won't change between app sessions
 */
function getDevicePassphrase(): string {
    // Chỉ dùng các giá trị ổn định, không thay đổi
    const components = [
        navigator.language,
        new Date().getTimezoneOffset().toString(),
    ];

    // Add a constant salt to make it harder to reverse engineer
    const salt = 'TranslateTool-v1-2025-stable';
    return components.join('|') + '|' + salt;
}

/**
 * Encrypt a string value
 */
export async function encrypt(plaintext: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Derive key from device passphrase
        const passphrase = getDevicePassphrase();
        const key = await deriveKey(passphrase, salt);

        // Encrypt the data
        const encryptedData = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(
            SALT_LENGTH + IV_LENGTH + encryptedData.byteLength
        );
        combined.set(salt, 0);
        combined.set(iv, SALT_LENGTH);
        combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt an encrypted string value
 */
export async function decrypt(encryptedText: string): Promise<string> {
    try {
        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

        // Extract salt, IV, and encrypted data
        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const encryptedData = combined.slice(SALT_LENGTH + IV_LENGTH);

        // Derive key from device passphrase
        const passphrase = getDevicePassphrase();
        const key = await deriveKey(passphrase, salt);

        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            encryptedData
        );

        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Validate if a string is a valid encrypted value
 */
export function isValidEncryptedString(value: string): boolean {
    try {
        const decoded = atob(value);
        return decoded.length >= SALT_LENGTH + IV_LENGTH;
    } catch {
        return false;
    }
}
