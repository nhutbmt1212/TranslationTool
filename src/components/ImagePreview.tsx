import React from 'react';

interface ImagePreviewProps {
    imagePreview: string | null;
    isProcessingOCR: boolean;
    countdown: number | null;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imagePreview, isProcessingOCR, countdown }) => {
    if (!imagePreview) return null;

    return (
        <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            {isProcessingOCR && (
                <div className="ocr-progress-bar">
                    <div className="ocr-progress-indicator" />
                </div>
            )}
            {countdown !== null && countdown > 0 && (
                <div className="countdown-badge" />
            )}
        </div>
    );
};

export default ImagePreview;
