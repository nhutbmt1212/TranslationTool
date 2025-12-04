/**
 * Python TTS Service using edge-tts
 * High quality, 300+ voices, 40+ languages
 */

interface TTSResult {
  success: boolean;
  audio_data?: string; // base64 encoded audio
  voice?: string;
  engine?: string;
  error?: string;
}

// Supported language codes (matching languages.json)
// Python TTS service handles the voice mapping directly
export const supportedTTSLanguages = [
  'af', 'am', 'ar', 'az', 'bg', 'bn', 'bs', 'ca', 'cs', 'cy',
  'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fil', 'fr',
  'ga', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is',
  'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'lo', 'lt',
  'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne', 'nl',
  'no', 'pl', 'ps', 'pt', 'ro', 'ru', 'si', 'sk', 'sl', 'so',
  'sq', 'sr', 'su', 'sv', 'sw', 'ta', 'te', 'th', 'tl', 'tr',
  'uk', 'ur', 'uz', 'vi', 'zh', 'zh-TW', 'zu'
];

class PythonTTSService {
  private isAvailable: boolean | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Check if Python TTS is available
   */
  async checkAvailable(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI?.pythonTTS) {
        const result = await window.electronAPI.pythonTTS.checkAvailable();
        this.isAvailable = result.success && result.available;
      } else {
        this.isAvailable = false;
      }
    } catch {
      this.isAvailable = false;
    }

    return this.isAvailable;
  }

  /**
   * Speak text using Python TTS
   */
  async speak(text: string, langCode: string): Promise<void> {
    // Stop any current playback
    this.stop();

    // Pass language code directly to Python TTS service
    const ttsLang = langCode;

    try {
      if (!window.electronAPI?.pythonTTS) {
        throw new Error('Python TTS not available');
      }

      const result: TTSResult = await window.electronAPI.pythonTTS.synthesize(text, ttsLang);

      if (!result.success) {
        throw new Error(result.error || 'TTS synthesis failed');
      }

      if (!result.audio_data) {
        throw new Error('No audio data generated');
      }

      // Convert base64 to blob and play
      const audioBlob = this.base64ToBlob(result.audio_data, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(audioUrl);
        
        this.currentAudio.onended = () => {
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        this.currentAudio.onerror = () => {
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
        };

        this.currentAudio.play().catch((e) => {
          URL.revokeObjectURL(audioUrl);
          reject(e);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const pythonTTS = new PythonTTSService();
