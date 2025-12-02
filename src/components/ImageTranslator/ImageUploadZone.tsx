import React from 'react';

interface ImageUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ onFileSelect }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="image-translator-upload">
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleChange}
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
  );
};

export default ImageUploadZone;
