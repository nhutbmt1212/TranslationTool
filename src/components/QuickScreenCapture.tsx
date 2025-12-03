import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface QuickScreenCaptureProps {
  onImageCaptured: (text: string) => void;
  disabled?: boolean;
}

const QuickScreenCapture: React.FC<QuickScreenCaptureProps> = ({ 
  onImageCaptured, 
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleQuickCapture = async () => {
    if (disabled || isCapturing) return;

    try {
      setIsCapturing(true);

      // Check if screen capture is available
      if (typeof window === 'undefined' || !window.electronAPI?.screenCapture) {
        toast.error(t('screenCapture.errors.notAvailable') || 'Screen capture not available');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(t('quickCapture.selecting') || 'Select region to translate...');
      
      // Use desktop selection overlay
      const imageBuffer = await window.electronAPI.screenCapture.selectDesktopRegion();
      
      toast.dismiss(loadingToast);
      
      if (imageBuffer) {
        // Show processing toast
        const processingToast = toast.loading(t('quickCapture.processing') || 'Processing image...');
        
        // Convert buffer to blob and create file for OCR
        const uint8Array = new Uint8Array(imageBuffer);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
        
        // Import OCR function dynamically
        const { detectAndTranslateText } = await import('../utils/imageTranslator');
        
        // Perform OCR only (no translation yet)
        const ocrResult = await detectAndTranslateText('', 'auto', 'en', undefined, undefined, file);
        
        // Extract all text from regions
        const extractedText = ocrResult.regions.map(region => region.text).join(' ').trim();
        
        toast.dismiss(processingToast);
        
        if (extractedText && extractedText.trim()) {
          // Set the extracted text to input
          onImageCaptured(extractedText);
          toast.success(t('quickCapture.success') || 'Text extracted and ready to translate!');
        } else {
          toast.error(t('quickCapture.noText') || 'No text found in the selected region');
        }
      } else {
        // User cancelled
        toast('Selection cancelled', { icon: '❌' });
      }
    } catch (error) {
      toast.error(t('quickCapture.error') || 'Failed to capture and process image');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <button
      type="button"
      className="quick-capture-button"
      onClick={handleQuickCapture}
      disabled={disabled || isCapturing}
      title={t('quickCapture.tooltip') || 'Quick screen capture and translate'}
    >
      {isCapturing ? (
        <div className="capture-spinner" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      )}
    </button>
  );
};

export default QuickScreenCapture;