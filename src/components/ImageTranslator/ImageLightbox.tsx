import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return createPortal(
    <div className="image-lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Zoomed" className="lightbox-image" />
      </div>
    </div>,
    document.body
  );
};

export default ImageLightbox;
