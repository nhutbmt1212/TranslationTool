import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
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
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadApiKey();
        }
    }, [open]);

    const loadApiKey = async () => {
        const key = await ApiKeyManager.getApiKey();
        setApiKey(key || '');
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await ApiKeyManager.saveApiKey(apiKey);
            toast.success(t('settings.apiKey.saved') || 'API key saved successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            toast.error(t('settings.apiKey.saveError') || 'Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (window.confirm(t('settings.apiKey.confirmClear') || 'Are you sure you want to clear the API key?')) {
            await ApiKeyManager.clearApiKey();
            setApiKey('');
            toast.success(t('settings.apiKey.cleared') || 'API key cleared');
        }
    };

    if (!open) return null;

    return (
        <div className="language-picker-overlay" onClick={onClose}>
            <div className="language-picker" onClick={(e) => e.stopPropagation()}>
                <div className="picker-header">
                    <div>
                        <p className="picker-eyebrow">{t('settings.eyebrow') || 'CONFIGURATION'}</p>
                        <h3>{t('settings.title') || 'Settings'}</h3>
                    </div>
                </div>

                <div className="settings-modal-content">
                    <div className="settings-section">
                        <h3>{t('settings.apiKey.title') || 'Gemini API Key'}</h3>
                        <p className="settings-description">
                            {t('settings.apiKey.description') ||
                                'Your API key is encrypted and stored securely in your browser. It will persist across sessions.'}
                        </p>

                        <div className="api-key-input-wrapper">
                            <div className="picker-search">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={t('settings.apiKey.placeholder') || 'Enter your Gemini API Key'}
                                    className="api-key-input"
                                />
                                <button
                                    type="button"
                                    className="toggle-visibility-button"
                                    onClick={() => setShowKey(!showKey)}
                                    title={showKey ? 'Hide' : 'Show'}
                                >
                                    {showKey ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {apiKey && (
                                <button
                                    type="button"
                                    className="clear-key-button"
                                    onClick={handleClear}
                                    title={t('settings.apiKey.clear') || 'Clear API Key'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="settings-help">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="get-key-link"
                            >
                                {t('settings.apiKey.getKey') || 'Get API Key'}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        </div>

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
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        {t('settings.save') || 'Save'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="settings-cancel-button"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                {t('settings.cancel') || 'Cancel'}
                            </button>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            {t('settings.security.title') || 'Security'}
                        </h3>
                        <ul className="security-info">
                            <li>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--accent)' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('settings.security.encrypted') || 'API key is encrypted using AES-GCM'}
                            </li>
                            <li>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--accent)' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('settings.security.session') || 'Stored in browser local storage (persists across sessions)'}
                            </li>
                            <li>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--accent)' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('settings.security.device') || 'Encryption key is device-specific'}
                            </li>
                            <li>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--accent)' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('settings.security.noServer') || 'Never sent to any server except Google AI'}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
