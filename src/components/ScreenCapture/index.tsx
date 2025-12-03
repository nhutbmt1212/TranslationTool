import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ScreenCaptureProps {
  onImageCaptured: (imageBuffer: Buffer) => void;
}

const ScreenCapture: React.FC<ScreenCaptureProps> = ({ onImageCaptured }) => {
  const { t } = useTranslation();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleStartCapture = async () => {
    try {
      // Check if screen capture is available
      if (typeof window === 'undefined' || !window.electronAPI?.screenCapture) {
        toast.error(t('screenCapture.errors.notAvailable') || 'Screen capture not available');
        return;
      }

      setIsSelecting(true);
      
      // Show loading toast
      const loadingToast = toast.loading(t('screenCapture.selecting') || 'Select region on desktop...');
      
      // Use desktop selection overlay
      const imageBuffer = await window.electronAPI.screenCapture.selectDesktopRegion();
      
      toast.dismiss(loadingToast);
      setIsSelecting(false);
      
      if (imageBuffer) {
        onImageCaptured(imageBuffer);
        toast.success(t('screenCapture.success') || 'Screen region captured successfully');
      } else {
        // User cancelled
        toast('Selection cancelled', { icon: '❌' });
      }
    } catch (error) {
      toast.error(t('screenCapture.errors.captureFailed') || 'Failed to capture screen region');
      setIsSelecting(false);
    }
  };



  return (
    <>
      <button
        type="button"
        className="screen-capture-button"
        onClick={handleStartCapture}
        title={t('screenCapture.tooltip') || 'Capture screen region'}
        disabled={isSelecting}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        {isSelecting ? (t('screenCapture.selecting') || 'Selecting...') : (t('screenCapture.button') || 'Screen Capture')}
      </button>


    </>
  );
};

export default ScreenCapture;