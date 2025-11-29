import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiKeyManager } from '../utils/apiKeyManager';
import '../styles/modal.css';
import '../styles/settings-modal.css';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadMaskedKey();
            setShowKey(false);
            setError(null);
            setSuccess(false);
        }
    }, [open]);

    const loadMaskedKey = async () => {
        const masked = await ApiKeyManager.getMaskedApiKey();
        setMaskedKey(masked);
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        if (!apiKey.trim()) {
            setError(t('settings.errors.emptyKey') || 'API key cannot be empty');
            return;
        }

        // Validate API key format
        const validation = ApiKeyManager.validateApiKeyFormat(apiKey);
        if (!validation.valid) {
            setError(validation.error || 'Invalid API key');
            return;
        }

        setIsLoading(true);

        try {
            await ApiKeyManager.saveApiKey(apiKey);
            setSuccess(true);
            setApiKey('');
            await loadMaskedKey();

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        ApiKeyManager.clearApiKey();
        setMaskedKey(null);
        setApiKey('');
        setSuccess(false);
        setError(null);
    };

    const handleClose = () => {
        setApiKey('');
        setError(null);
        setSuccess(false);
        setShowKey(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="language-picker-overlay" onClick={handleClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2>⚙️ {t('settings.title') || 'Settings'}</h2>
                    <button
                        type="button"
                        className="settings-close-button"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="settings-modal-content">
                    <div className="settings-section">
                        <h3>🔑 {t('settings.apiKey.title') || 'Gemini API Key'}</h3>
                        <p className="settings-description">
                            {t('settings.apiKey.description') ||
                                'Your API key is encrypted and stored securely in your browser. It will persist across sessions.'}
                        </p>

                        {maskedKey && (
                            <div className="current-key-display">
                                <div className="current-key-label">
                                    {t('settings.apiKey.current') || 'Current API Key:'}
                                </div>
                                <div className="current-key-value">
                                    <code>{maskedKey}</code>
                                    <button
                                        type="button"
                                        className="clear-key-button"
                                        onClick={handleClear}
                                        title={t('settings.apiKey.clear') || 'Clear API Key'}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="api-key-input">
                                {maskedKey
                                    ? t('settings.apiKey.update') || 'Update API Key'
                                    : t('settings.apiKey.enter') || 'Enter API Key'}
                            </label>
                            <div className="api-key-input-wrapper">
                                <input
                                    id="api-key-input"
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="api-key-input"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <button
                                    type="button"
                                    className="toggle-visibility-button"
                                    onClick={() => setShowKey(!showKey)}
                                    title={showKey ? 'Hide' : 'Show'}
                                >
                                    {showKey ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <div className="input-hint">
                                {t('settings.apiKey.hint') ||
                                    'Get your API key from Google AI Studio'}
                                {' '}
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="external-link"
                                >
                                    {t('settings.apiKey.getKey') || 'Get API Key'} ↗
                                </a>
                            </div>
                        </div>

                        {error && (
                            <div className="settings-error" role="alert">
                                ❌ {error}
                            </div>
                        )}

                        {success && (
                            <div className="settings-success" role="alert">
                                ✅ {t('settings.apiKey.saved') || 'API key saved successfully!'}
                            </div>
                        )}

                        <div className="settings-actions">
                            <button
                                type="button"
                                className="settings-save-button"
                                onClick={handleSave}
                                disabled={isLoading || !apiKey.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="button-spinner" />
                                        {t('settings.saving') || 'Saving...'}
                                    </>
                                ) : (
                                    <>💾 {t('settings.save') || 'Save'}</>
                                )}
                            </button>
                            <button
                                type="button"
                                className="settings-cancel-button"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {t('settings.cancel') || 'Cancel'}
                            </button>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>🔒 {t('settings.security.title') || 'Security'}</h3>
                        <ul className="security-info">
                            <li>✓ {t('settings.security.encrypted') || 'API key is encrypted using AES-GCM'}</li>
                            <li>✓ {t('settings.security.session') || 'Stored in browser local storage (persists across sessions)'}</li>
                            <li>✓ {t('settings.security.device') || 'Encryption key is device-specific'}</li>
                            <li>✓ {t('settings.security.noServer') || 'Never sent to any server except Google AI'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
