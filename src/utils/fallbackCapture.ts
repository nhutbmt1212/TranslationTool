import screenshot from 'screenshot-desktop';
import sharp from 'sharp';

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FallbackScreenCapture {
  /**
   * Capture full screen using screenshot-desktop
   */
  async captureFullScreen(): Promise<Buffer> {
    try {
      const img = await screenshot({ format: 'png' });
      return Buffer.from(img);
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error}`);
    }
  }

  /**
   * Capture region by cropping full screen
   */
  async captureRegion(region: CaptureRegion): Promise<Buffer> {
    try {
      const fullScreen = await this.captureFullScreen();
      
      // Use sharp to crop the region
      const croppedBuffer = await sharp(fullScreen)
        .extract({
          left: Math.max(0, region.x),
          top: Math.max(0, region.y),
          width: region.width,
          height: region.height
        })
        .png()
        .toBuffer();

      return croppedBuffer;
    } catch (error) {
      throw new Error(`Failed to capture region: ${error}`);
    }
  }

  /**
   * Get screen dimensions (approximate)
   */
  async getScreenSize(): Promise<{ width: number; height: number }> {
    try {
      const img = await screenshot({ format: 'png' });
      const metadata = await sharp(Buffer.from(img)).metadata();
      
      return {
        width: metadata.width || 1920,
        height: metadata.height || 1080
      };
    } catch (error) {
      // Fallback to common resolution
      return { width: 1920, height: 1080 };
    }
  }
}