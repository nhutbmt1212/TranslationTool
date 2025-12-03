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
    console.log('🚀 [QuickCapture] Starting quick capture process');
    
    if (disabled || isCapturing) {
      console.log('❌ [QuickCapture] Capture blocked - disabled:', disabled, 'isCapturing:', isCapturing);
      return;
    }

    try {
      setIsCapturing(true);
      console.log('📸 [QuickCapture] Set capturing state to true');

      // Check if screen capture is available
      if (typeof window === 'undefined' || !window.electronAPI?.screenCapture) {
        console.error('❌ [QuickCapture] Screen capture API not available');
        toast.error(t('screenCapture.errors.notAvailable') || 'Screen capture not available');
        return;
      }

      console.log('✅ [QuickCapture] Screen capture API available');

      // Show loading toast
      const loadingToast = toast.loading(t('quickCapture.selecting') || 'Select region to translate...');
      console.log('🔄 [QuickCapture] Showing selection toast');
      
      // Use desktop selection overlay
      console.log('🖱️ [QuickCapture] Starting desktop region selection');
      const imageBuffer = await window.electronAPI.screenCapture.selectDesktopRegion();
      
      toast.dismiss(loadingToast);
      console.log('📋 [QuickCapture] Selection completed, buffer size:', imageBuffer ? imageBuffer.length : 'null');
      
      if (imageBuffer) {
        // Show processing toast
        const processingToast = toast.loading(t('quickCapture.processing') || 'Processing image...');
        console.log('🔄 [QuickCapture] Starting image processing');
        
        // Convert buffer to blob and create file for OCR
        const uint8Array = new Uint8Array(imageBuffer);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
        
        console.log('📄 [QuickCapture] Created file for OCR, size:', file.size, 'bytes');
        
        // Import OCR function dynamically
        console.log('📚 [QuickCapture] Importing OCR module');
        const { detectAndTranslateText } = await import('../utils/imageTranslator');
        
        // Perform OCR only (no translation yet)
        console.log('🔍 [QuickCapture] Starting OCR process');
        const ocrResult = await detectAndTranslateText('', 'auto', 'en', undefined, undefined, file);
        
        console.log('📝 [QuickCapture] OCR completed, regions found:', ocrResult.regions.length);
        
        // Extract all text from regions
        const extractedText = ocrResult.regions.map(region => region.text).join(' ').trim();
        
        console.log('📖 [QuickCapture] Extracted text length:', extractedText.length);
        console.log('📖 [QuickCapture] Extracted text preview:', extractedText.substring(0, 100));
        
        toast.dismiss(processingToast);
        
        if (extractedText && extractedText.trim()) {
          // Set the extracted text to input
          onImageCaptured(extractedText);
          console.log('✅ [QuickCapture] Text successfully extracted and passed to parent');
          toast.success(t('quickCapture.success') || 'Text extracted and ready to translate!');
        } else {
          console.log('❌ [QuickCapture] No text found in extracted regions');
          toast.error(t('quickCapture.noText') || 'No text found in the selected region');
        }
      } else {
        // User cancelled
        console.log('🚫 [QuickCapture] User cancelled selection');
        toast('Selection cancelled', { icon: '❌' });
      }
    } catch (error) {
      console.error('💥 [QuickCapture] Error during capture process:', error);
      toast.error(t('quickCapture.error') || 'Failed to capture and process image');
    } finally {
      setIsCapturing(false);
      console.log('🏁 [QuickCapture] Capture process finished, reset state');
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