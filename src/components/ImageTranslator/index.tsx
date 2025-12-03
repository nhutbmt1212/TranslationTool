import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageTranslation } from '../../hooks/useImageTranslation';
import ImageUploadZone from './ImageUploadZone';
import ImageComparisonView from './ImageComparisonView';
import ScreenCapture from '../ScreenCapture';
import {
  ImageTranslatorIcon,
  ImageHeaderIcon,
  CloseIcon,
  ResetIcon,
  DownloadIcon,
  TranslateIcon,
} from './icons';
import '../../styles/image-translator.css';
import '../../styles/screen-capture.css';

// Default translation language pair
const DEFAULT_SOURCE_LANG = 'en';
const DEFAULT_TARGET_LANG = 'vi';

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

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const handleTranslate = useCallback(
    () => handleProcess(DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG),
    [handleProcess]
  );

  const handleScreenCapture = useCallback(
    (imageBuffer: Buffer) => {
      const uint8Array = new Uint8Array(imageBuffer);
      const blob = new Blob([uint8Array], { type: 'image/png' });
      const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
      handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const modalClassName = `image-translator-modal ${selectedImage ? 'modal-expanded' : ''}`;

  return (
    <>
      <button
        className="floating-image-translator-button"
        onClick={openModal}
        title="Image Translator"
        aria-label="Open image translator"
      >
        <ImageTranslatorIcon />
      </button>

      {isOpen && (
        <div className="image-translator-overlay" onClick={closeModal}>
          <div className={modalClassName} onClick={stopPropagation}>
            <div className="image-translator-header">
              <div className="image-translator-title-row">
                <ImageHeaderIcon />
                <h3>{t('imageTranslator.title')}</h3>
              </div>
              <button
                className="image-translator-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <CloseIcon />
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

            {selectedImage && (
              <div className="image-translator-footer footer-center">
                <div className="image-translator-actions">
                  <button className="btn-change-image" onClick={handleReset} disabled={isProcessing}>
                    <ResetIcon />
                    {t('imageTranslator.reset')}
                  </button>
                  {translatedImage ? (
                    <button className="btn-download-image" onClick={handleDownload}>
                      <DownloadIcon />
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
                          <TranslateIcon />
                          {t('imageTranslator.translate')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageTranslator;
