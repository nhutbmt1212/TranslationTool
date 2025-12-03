import { useEffect, useCallback } from 'react';

interface UseGlobalShortcutsOptions {
  isTranslating: boolean;
  isProcessingOCR: boolean;
  captureScreen: () => Promise<string | null>;
  onCaptureSuccess: (text: string) => void;
  handleTranslate: (text: string, textOverride?: string) => Promise<void>;
}

export const useGlobalShortcuts = ({
  isTranslating,
  isProcessingOCR,
  captureScreen,
  onCaptureSuccess,
  handleTranslate,
}: UseGlobalShortcutsOptions) => {
  const handleGlobalScreenCapture = useCallback(async () => {
    if (isTranslating || isProcessingOCR) return;

    const extractedText = await captureScreen();
    if (extractedText) {
      onCaptureSuccess(extractedText);
      handleTranslate(extractedText, extractedText);
    }
  }, [captureScreen, isTranslating, isProcessingOCR, handleTranslate, onCaptureSuccess]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onTriggerScreenCapture) return;

    const cleanup = api.onTriggerScreenCapture(() => {
      handleGlobalScreenCapture();
    });

    return cleanup;
  }, [handleGlobalScreenCapture]);
};
