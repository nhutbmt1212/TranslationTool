import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { detectAndTranslateText, imageToBase64WithDimensions, replaceTextInImage } from '../utils/imageTranslator';
import '../styles/image-translator.css';

const ImageTranslator: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [translatedImage, setTranslatedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setTranslatedImage(null);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async () => {
        if (!selectedFile) {
            toast.error('Please select an image first');
            return;
        }

        setIsProcessing(true);
        toast.loading('Detecting and translating text...', { id: 'translate-image' });

        try {
            // Step 1: Convert image to base64 and get dimensions for accurate bbox
            const imageInfo = await imageToBase64WithDimensions(selectedFile);

            // Step 2: Detect text with Tesseract + translate with Gemini
            const result = await detectAndTranslateText(
                imageInfo.base64, 
                'en', 
                'vi',
                imageInfo.width,
                imageInfo.height,
                selectedFile // Pass file for Tesseract OCR
            );

            if (!result.success) {
                throw new Error(result.error || 'Translation failed');
            }

            if (result.regions.length === 0) {
                toast.error('No text detected in image', { id: 'translate-image' });
                setIsProcessing(false);
                return;
            }

            // Log detected regions for debugging
            console.log('Detected regions:', result.regions);
            console.log('Image dimensions:', imageInfo.width, 'x', imageInfo.height);
            
            toast.success(`Found ${result.regions.length} text region(s)`, { id: 'translate-image' });

            // Step 3: Replace text in image with translations
            const newImage = await replaceTextInImage(selectedFile, result.regions, false);
            setTranslatedImage(newImage);

            toast.success('Translation complete!', { id: 'translate-image' });
        } catch (error) {
            console.error('Translation error:', error);
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
        const input = document.getElementById('image-upload') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleDownload = () => {
        if (!translatedImage) return;

        const link = document.createElement('a');
        link.href = translatedImage;
        link.download = `translated-${Date.now()}.png`;
        link.click();
        toast.success('Image downloaded!');
    };

    return (
        <>
            <button
                className="floating-image-translator-button"
                onClick={() => setIsOpen(true)}
                title="Image Translator"
                aria-label="Open image translator"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                    <path d="M12 18h6" />
                    <path d="M15 15v6" />
                </svg>
            </button>

            {isOpen && (
                <div className="image-translator-overlay" onClick={() => setIsOpen(false)}>
                    <div className="image-translator-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="image-translator-header">
                            <div>
                                <h3>🖼️ Image Translator</h3>
                                <p className="image-translator-subtitle">Translate text in images</p>
                            </div>
                            <button
                                className="image-translator-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="image-translator-content">
                            {!selectedImage ? (
                                <div className="image-translator-upload">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="image-upload" className="image-upload-label">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <p className="upload-text">Click to upload image</p>
                                        <p className="upload-hint">PNG, JPG, JPEG up to 10MB</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="image-translator-preview">
                                    <div className="image-comparison">
                                        <div className="image-box">
                                            <p className="image-label">Original</p>
                                            <img src={selectedImage} alt="Original" className="preview-image" />
                                        </div>
                                        {translatedImage && (
                                            <div className="image-box">
                                                <p className="image-label">Translated</p>
                                                <img src={translatedImage} alt="Translated" className="preview-image" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="image-translator-actions">
                                        <button
                                            className="btn-change-image"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="1 4 1 10 7 10" />
                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                            </svg>
                                            Reset
                                        </button>
                                        {translatedImage ? (
                                            <button
                                                className="btn-download-image"
                                                onClick={handleDownload}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Download
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-translate-image"
                                                onClick={handleProcess}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <span className="button-spinner" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                            <path d="M9 12l2 2 4-4" />
                                                        </svg>
                                                        Translate
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="image-translator-footer">
                            <div className="feature-list">
                                <div className="feature-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Detect text in image</span>
                                </div>
                                <div className="feature-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Translate to target language</span>
                                </div>
                                <div className="feature-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Replace text in original image</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageTranslator;
