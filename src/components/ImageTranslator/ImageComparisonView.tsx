import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

interface ImageComparisonViewProps {
  originalImage: string;
  translatedImage: string | null;
}

const ImageComparisonView: React.FC<ImageComparisonViewProps> = ({
  originalImage,
  translatedImage,
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleImageClick = (image: string) => {
    setLightboxImage(image);
  };

  return (
    <>
      <div className="image-translator-preview">
        <div className="image-comparison">
          <div className="image-box">
            <p className="image-label">Original</p>
            <img
              src={originalImage}
              alt="Original"
              className="preview-image"
              onClick={() => handleImageClick(originalImage)}
              role="button"
              tabIndex={0}
            />
          </div>
          {translatedImage && (
            <div className="image-box">
              <p className="image-label">Translated</p>
              <img
                src={translatedImage}
                alt="Translated"
                className="preview-image"
                onClick={() => handleImageClick(translatedImage)}
                role="button"
                tabIndex={0}
              />
            </div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </>
  );
};

export default ImageComparisonView;
