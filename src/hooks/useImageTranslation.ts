import { useState } from 'react';
import toast from 'react-hot-toast';
import { detectAndTranslateText, imageToBase64WithDimensions, replaceTextInImage } from '../utils/imageTranslator';

interface UseImageTranslationReturn {
  selectedImage: string | null;
  selectedFile: File | null;
  translatedImage: string | null;
  isProcessing: boolean;
  handleImageSelect: (file: File) => void;
  handleProcess: (sourceLang: string, targetLang: string) => Promise<void>;
  handleReset: () => void;
  handleDownload: () => void;
}

export const useImageTranslation = (): UseImageTranslationReturn => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    setTranslatedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async (sourceLang: string, targetLang: string) => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    toast.loading('Detecting and translating text...', { id: 'translate-image' });

    try {
      const imageInfo = await imageToBase64WithDimensions(selectedFile);

      const result = await detectAndTranslateText(
        imageInfo.base64,
        sourceLang,
        targetLang,
        imageInfo.width,
        imageInfo.height,
        selectedFile
      );

      if (!result.success) {
        throw new Error(result.error || 'Translation failed');
      }

      if (result.regions.length === 0) {
        toast.error('No text detected in image', { id: 'translate-image' });
        return;
      }

      toast.success(`Found ${result.regions.length} text region(s)`, { id: 'translate-image' });

      const newImage = await replaceTextInImage(selectedFile, result.regions, false);
      setTranslatedImage(newImage);

      toast.success('Translation complete!', { id: 'translate-image' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to translate image',
        { id: 'translate-image' }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setTranslatedImage(null);
  };

  const handleDownload = () => {
    if (!translatedImage) return;

    const link = document.createElement('a');
    link.href = translatedImage;
    link.download = `translated-${Date.now()}.png`;
    link.click();
    toast.success('Image downloaded!');
  };

  return {
    selectedImage,
    selectedFile,
    translatedImage,
    isProcessing,
    handleImageSelect,
    handleProcess,
    handleReset,
    handleDownload,
  };
};
