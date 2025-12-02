import React from 'react';
import { useTranslation } from 'react-i18next';
import ProgressCircle from './ProgressCircle';

interface ImagePreviewProps {
  imagePreview: string | null;
  isProcessingOCR: boolean;
  countdown: number | null;
  maxCountdown?: number;
  onClose?: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  isProcessingOCR,
  countdown,
  maxCountdown = 10,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!imagePreview) return null;

  return (
    <div className="image-preview-toast">
      <div className="image-preview-content">
        <img src={imagePreview} alt="Preview" className="image-preview-img" />
        {isProcessingOCR && (
          <div className="ocr-progress-overlay">
            <div className="ocr-progress-bar">
              <div className="ocr-progress-indicator" />
            </div>
            <span className="ocr-status-text">{t('status.processing')}</span>
          </div>
        )}
      </div>
      <div className="image-preview-footer">
        {countdown !== null && countdown > 0 && (
          <ProgressCircle countdown={countdown} maxCountdown={maxCountdown} />
        )}
        {onClose && (
          <button
            className="image-preview-close"
            onClick={onClose}
            aria-label="Close preview"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
