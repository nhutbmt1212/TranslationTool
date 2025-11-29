/**
 * API Key Manager
 * Handles secure storage and retrieval of API keys using encryption
 */

import { encrypt, decrypt } from './crypto';

const STORAGE_KEY = 'gemini_api_key_encrypted';

export class ApiKeyManager {
    private static cachedKey: string | null = null;

    /**
     * Save API key to localStorage (encrypted)
     */
    static async saveApiKey(apiKey: string): Promise<void> {
        if (!apiKey || apiKey.trim().length === 0) {
            throw new Error('API key cannot be empty');
        }

        try {
            const encrypted = await encrypt(apiKey.trim());
            localStorage.setItem(STORAGE_KEY, encrypted);
            this.cachedKey = apiKey.trim();
        } catch (error) {
            console.error('Failed to save API key:', error);
            throw new Error('Failed to save API key securely');
        }
    }

    /**
     * Get API key from localStorage (decrypted)
     * Returns cached version if available
     */
    static async getApiKey(): Promise<string | null> {
        // Return cached key if available
        if (this.cachedKey) {
            return this.cachedKey;
        }

        try {
            const encrypted = localStorage.getItem(STORAGE_KEY);
            if (!encrypted) {
                return null;
            }

            const decrypted = await decrypt(encrypted);
            this.cachedKey = decrypted;
            return decrypted;
        } catch (error) {
            console.error('Failed to retrieve API key:', error);
            // Clear corrupted data
            this.clearApiKey();
            return null;
        }
    }

    /**
     * Check if API key exists
     */
    static hasApiKey(): boolean {
        return localStorage.getItem(STORAGE_KEY) !== null || this.cachedKey !== null;
    }

    /**
     * Clear API key from storage and cache
     */
    static clearApiKey(): void {
        localStorage.removeItem(STORAGE_KEY);
        this.cachedKey = null;
    }

    /**
     * Validate API key format (basic validation)
     */
    static validateApiKeyFormat(apiKey: string): { valid: boolean; error?: string } {
        if (!apiKey || apiKey.trim().length === 0) {
            return { valid: false, error: 'API key cannot be empty' };
        }

        const trimmed = apiKey.trim();

        // Basic format validation for Google API keys
        // They typically start with "AIza" and are 39 characters long
        if (!trimmed.startsWith('AIza')) {
            return { valid: false, error: 'Invalid API key format. Google API keys should start with "AIza"' };
        }

        if (trimmed.length !== 39) {
            return { valid: false, error: 'Invalid API key length. Google API keys should be 39 characters' };
        }

        // Check for valid characters (alphanumeric, -, _)
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
            return { valid: false, error: 'API key contains invalid characters' };
        }

        return { valid: true };
    }

    /**
     * Get masked API key for display (shows first 8 and last 4 characters)
     */
    static async getMaskedApiKey(): Promise<string | null> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            return null;
        }

        if (apiKey.length <= 12) {
            return '***';
        }

        return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
    }
}
