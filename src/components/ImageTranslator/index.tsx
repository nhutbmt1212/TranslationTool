import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageTranslation } from '../../hooks/useImageTranslation';
import ImageUploadZone from './ImageUploadZone';
import ImageComparisonView from './ImageComparisonView';
import ScreenCapture from '../ScreenCapture';
import '../../styles/image-translator.css';
import '../../styles/screen-capture.css';

const ImageTranslator: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    selectedImage,
    translatedImage,
    isProcessing,
    handleImageSelect,
    handleProcess,
    handleReset,
    handleDownload,
  } = useImageTranslation();

  const handleTranslate = () => handleProcess('en', 'vi');

  const handleScreenCapture = (imageBuffer: Buffer) => {
    // Convert buffer to blob and create file
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
    handleImageSelect(file);
  };

  return (
    <>
      <button
        className="floating-image-translator-button"
        onClick={() => setIsOpen(true)}
        title="Image Translator"
        aria-label="Open image translator"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
          <path d="M12 18h6" />
          <path d="M15 15v6" />
        </svg>
      </button>

      {isOpen && (
        <div className="image-translator-overlay" onClick={() => setIsOpen(false)}>
          <div className="image-translator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-translator-header">
              <div>
                <h3>🖼️ {t('imageTranslator.title')}</h3>
                <p className="image-translator-subtitle">{t('imageTranslator.subtitle')}</p>
              </div>
              <button
                className="image-translator-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="image-translator-content">
              {!selectedImage ? (
                <div>
                  <ImageUploadZone onFileSelect={handleImageSelect} />
                  <div className="screen-capture-section">
                    <div className="divider">
                      <span>{t('imageTranslator.or')}</span>
                    </div>
                    <ScreenCapture onImageCaptured={handleScreenCapture} />
                  </div>
                </div>
              ) : (
                <ImageComparisonView
                  originalImage={selectedImage}
                  translatedImage={translatedImage}
                />
              )}
            </div>

            <div className={`image-translator-footer ${selectedImage ? 'footer-center' : ''}`}>
              {selectedImage ? (
                <div className="image-translator-actions">
                  <button className="btn-change-image" onClick={handleReset} disabled={isProcessing}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    {t('imageTranslator.reset')}
                  </button>
                  {translatedImage ? (
                    <button className="btn-download-image" onClick={handleDownload}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {t('imageTranslator.download')}
                    </button>
                  ) : (
                    <button className="btn-translate-image" onClick={handleTranslate} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <span className="button-spinner" />
                          {t('imageTranslator.processing')}
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          {t('imageTranslator.translate')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="feature-list">
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t('imageTranslator.feature1')}</span>
                  </div>
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t('imageTranslator.feature2')}</span>
                  </div>
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t('imageTranslator.feature3')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageTranslator;
