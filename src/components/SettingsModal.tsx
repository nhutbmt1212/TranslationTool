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

interface UpdateInfo {
    version: string;
    releaseDate?: string;
}

interface DownloadProgress {
    percent: number;
    transferred: number;
    total: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'apiKey' | 'update'>('apiKey');

    // API Key states
    const [apiKey, setApiKey] = useState('');
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Update states
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [updateReady, setUpdateReady] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [appVersion, setAppVersion] = useState('1.0.0');

    useEffect(() => {
        if (open) {
            loadMaskedKey();
            loadAppVersion();
            setApiKey('');
            setShowKey(false);
        }
    }, [open]);

    const loadAppVersion = async () => {
        if (window.electronAPI?.getAppVersion) {
            const version = await window.electronAPI.getAppVersion();
            setAppVersion(version);
        }
    };

    // Setup update listeners
    useEffect(() => {
        if (!window.electronAPI) return;

        const removeChecking = window.electronAPI.onUpdateChecking?.(() => {
            setCheckingUpdate(true);
            setUpdateError(null);
        });

        const removeAvailable = window.electronAPI.onUpdateAvailable?.((info: UpdateInfo) => {
            setCheckingUpdate(false);
            setUpdateAvailable(true);
            setUpdateInfo(info);
        });

        const removeNotAvailable = window.electronAPI.onUpdateNotAvailable?.(() => {
            setCheckingUpdate(false);
            setUpdateAvailable(false);
            toast.success(t('settings.update.noUpdate') || 'You are using the latest version');
        });

        const removeError = window.electronAPI.onUpdateError?.((error: any) => {
            setCheckingUpdate(false);
            setDownloading(false);
            setUpdateError(error?.message || 'Lỗi kiểm tra update');
        });

        const removeProgress = window.electronAPI.onUpdateDownloadProgress?.((progress: DownloadProgress) => {
            setDownloadProgress(Math.round(progress.percent));
        });

        const removeDownloaded = window.electronAPI.onUpdateDownloaded?.(() => {
            setDownloading(false);
            setUpdateReady(true);
            toast.success(t('settings.update.readyToInstall') || 'Update ready to install!');
        });

        return () => {
            removeChecking?.();
            removeAvailable?.();
            removeNotAvailable?.();
            removeError?.();
            removeProgress?.();
            removeDownloaded?.();
        };
    }, []);

    const loadMaskedKey = async () => {
        const masked = await ApiKeyManager.getMaskedApiKey();
        setMaskedKey(masked);
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error(t('settings.errors.emptyKey') || 'API key cannot be empty');
            return;
        }

        const validation = ApiKeyManager.validateApiKeyFormat(apiKey);
        if (!validation.valid) {
            toast.error(validation.error || 'Invalid API key');
            return;
        }

        setIsLoading(true);
        try {
            await ApiKeyManager.saveApiKey(apiKey);
            toast.success(t('settings.apiKey.saved') || 'API key saved successfully!');
            setApiKey('');
            await loadMaskedKey();
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            toast.error(t('settings.apiKey.saveError') || 'Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (window.confirm(t('settings.apiKey.confirmClear') || 'Are you sure you want to clear the API key?')) {
            await ApiKeyManager.clearApiKey();
            setMaskedKey(null);
            setApiKey('');
            toast.success(t('settings.apiKey.cleared') || 'API key cleared');
        }
    };

    const handleCheckUpdate = async () => {
        if (!window.electronAPI?.checkForUpdates) {
            toast.error(t('settings.update.notAvailable') || 'Update not available in this environment');
            return;
        }
        setCheckingUpdate(true);
        setUpdateError(null);
        setUpdateAvailable(false);
        try {
            const result = await window.electronAPI.checkForUpdates();
            if (!result.success) {
                setUpdateError(result.error || t('settings.update.error'));
                setCheckingUpdate(false);
            }
        } catch (error) {
            setUpdateError(t('settings.update.error') || 'Update check failed');
            setCheckingUpdate(false);
        }
    };

    const handleDownloadUpdate = async () => {
        if (!window.electronAPI?.downloadUpdate) return;
        setDownloading(true);
        setDownloadProgress(0);
        try {
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            toast.error(t('settings.update.error') || 'Download failed');
            setDownloading(false);
        }
    };

    const handleInstallUpdate = () => {
        if (!window.electronAPI?.installUpdate) return;
        window.electronAPI.installUpdate();
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

                {/* Tabs */}
                <div className="settings-tabs">
                    <button
                        className={`settings-tab ${activeTab === 'apiKey' ? 'active' : ''}`}
                        onClick={() => setActiveTab('apiKey')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                        API Key
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'update' ? 'active' : ''}`}
                        onClick={() => setActiveTab('update')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Update
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="settings-modal-content">
                    {/* API Key Tab */}
                    {activeTab === 'apiKey' && (
                        <>
                            <div className="settings-section">
                                <h3>{t('settings.apiKey.title') || 'Gemini API Key'}</h3>
                                <p className="settings-description">
                                    {t('settings.apiKey.description') ||
                                        'Your API key is encrypted and stored securely on your device.'}
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
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
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
                                        <div className="picker-search">
                                            <input
                                                id="api-key-input"
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder={t('settings.apiKey.placeholder') || 'Enter your Gemini API Key'}
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
                                                {showKey ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
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
                            </div>

                            <div className="settings-section">
                                <h3>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    {t('settings.security.title') || 'Security'}
                                </h3>
                                <ul className="security-info">
                                    <li>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {t('settings.security.encrypted') || 'API key is encrypted using AES-GCM'}
                                    </li>
                                    <li>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {t('settings.security.session') || 'Stored permanently on your device'}
                                    </li>
                                    <li>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {t('settings.security.device') || 'Encryption key is device-specific'}
                                    </li>
                                    <li>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {t('settings.security.noServer') || 'Never sent to any server except Google AI'}
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Update Tab */}
                    {activeTab === 'update' && (
                        <div className="settings-section">
                            <h3>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {t('settings.update.title') || 'App Update'}
                            </h3>
                            <p className="settings-description">
                                {t('settings.update.description') || 'Check and install the latest version of the application.'}
                            </p>

                            <div className="update-info-box">
                                <div className="update-info-label">{t('settings.update.currentVersion') || 'Current version'}</div>
                                <div className="update-info-value">v{appVersion}</div>
                            </div>

                            {updateError && (
                                <div className="update-error">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    {updateError}
                                </div>
                            )}

                            {updateReady && (
                                <div className="update-ready-box">
                                    <div className="update-ready-icon">🎉</div>
                                    <div className="update-ready-text">
                                        <strong>{t('settings.update.readyToInstall') || 'Update ready!'}</strong>
                                        <p>{t('settings.update.readyDescription', { version: updateInfo?.version }) || `Version ${updateInfo?.version} has been downloaded`}</p>
                                    </div>
                                </div>
                            )}

                            {downloading && (
                                <div className="update-progress-box">
                                    <div className="update-progress-label">{t('settings.update.downloading') || 'Downloading update...'}</div>
                                    <div className="update-progress-bar">
                                        <div
                                            className="update-progress-fill"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <div className="update-progress-text">{downloadProgress}%</div>
                                </div>
                            )}

                            {updateAvailable && !downloading && !updateReady && (
                                <div className="update-available-box">
                                    <div className="update-available-icon">🔔</div>
                                    <div className="update-available-text">
                                        <strong>{t('settings.update.newVersion') || 'New version available!'}</strong>
                                        <p>{t('settings.update.versionAvailable', { version: updateInfo?.version }) || `Version ${updateInfo?.version} is available`}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions - Always at bottom */}
                <div className="settings-actions">
                    {activeTab === 'apiKey' ? (
                        <>
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
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        </>
                    ) : (
                        <>
                            {updateReady ? (
                                <button
                                    type="button"
                                    className="settings-save-button"
                                    onClick={handleInstallUpdate}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    {t('settings.update.installNow') || 'Install now'}
                                </button>
                            ) : updateAvailable && !downloading ? (
                                <button
                                    type="button"
                                    className="settings-save-button"
                                    onClick={handleDownloadUpdate}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    {t('settings.update.download') || 'Download'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="settings-save-button"
                                    onClick={handleCheckUpdate}
                                    disabled={checkingUpdate || downloading}
                                >
                                    {checkingUpdate ? (
                                        <>
                                            <span className="button-spinner" />
                                            {t('settings.update.checking') || 'Checking...'}
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="23 4 23 10 17 10" />
                                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                            </svg>
                                            {t('settings.update.checkUpdate') || 'Check for updates'}
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                className="settings-cancel-button"
                                onClick={onClose}
                            >
                                {t('settings.cancel') || 'Close'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
