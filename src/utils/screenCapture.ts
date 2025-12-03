export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

export class ScreenCaptureService {
  /**
   * Get screen dimensions
   */
  async getScreenSize(): Promise<ScreenSize> {
    if (typeof window !== 'undefined' && window.electronAPI?.screenCapture) {
      return await window.electronAPI.screenCapture.getSize();
    }
    throw new Error('Screen capture not available');
  }

  /**
   * Capture a region of the screen
   */
  async captureRegion(region: ScreenRegion): Promise<Buffer> {
    if (typeof window !== 'undefined' && window.electronAPI?.screenCapture) {
      return await window.electronAPI.screenCapture.captureRegion(region);
    }
    throw new Error('Screen capture not available');
  }

  /**
   * Capture full screen
   */
  async captureFullScreen(): Promise<Buffer> {
    if (typeof window !== 'undefined' && window.electronAPI?.screenCapture) {
      return await window.electronAPI.screenCapture.captureFullScreen();
    }
    throw new Error('Screen capture not available');
  }
}

export const screenCapture = new ScreenCaptureService();