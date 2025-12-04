#!/usr/bin/env python3
"""
OCR Service using EasyOCR or Tesseract
Receives image path, returns detected text with bounding boxes
"""

import sys
import json
import base64
from pathlib import Path
from typing import List, Dict, Any

# Try EasyOCR first (better accuracy), fallback to Tesseract
try:
    import easyocr
    OCR_ENGINE = 'easyocr'
except ImportError:
    try:
        import pytesseract
        from PIL import Image
        OCR_ENGINE = 'tesseract'
    except ImportError:
        print(json.dumps({
            'success': False,
            'error': 'No OCR engine available. Install easyocr or pytesseract'
        }))
        sys.exit(1)


class OCRService:
    def __init__(self):
        if OCR_ENGINE == 'easyocr':
            # Initialize EasyOCR reader
            # Note: Many Asian languages (ja, ko, ch_*) only work with English
            # Using English + Vietnamese for best compatibility
            # Can detect most Latin-based and Vietnamese text
            self.reader = easyocr.Reader(['en', 'vi'])
        
    def process_image(self, image_path: str, languages: List[str] = None) -> Dict[str, Any]:
        """
        Process image and extract text with bounding boxes
        
        Args:
            image_path: Path to image file
            languages: List of language codes (optional)
            
        Returns:
            Dict with success status, text, and bounding boxes
        """
        try:
            if OCR_ENGINE == 'easyocr':
                return self._process_with_easyocr(image_path, languages)
            else:
                return self._process_with_tesseract(image_path)
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process_with_easyocr(self, image_path: str, languages: List[str] = None) -> Dict[str, Any]:
        """Process image using EasyOCR"""
        # Read image and detect text
        results = self.reader.readtext(image_path, detail=1)
        
        if not results:
            return {
                'success': True,
                'text': '',
                'blocks': [],
                'engine': 'easyocr'
            }
        
        # Extract text and bounding boxes
        blocks = []
        full_text = []
        
        for bbox, text, confidence in results:
            # bbox is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]
            
            blocks.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': {
                    'x': int(min(x_coords)),
                    'y': int(min(y_coords)),
                    'width': int(max(x_coords) - min(x_coords)),
                    'height': int(max(y_coords) - min(y_coords))
                }
            })
            full_text.append(text)
        
        return {
            'success': True,
            'text': ' '.join(full_text),
            'blocks': blocks,
            'engine': 'easyocr'
        }
    
    def _process_with_tesseract(self, image_path: str) -> Dict[str, Any]:
        """Process image using Tesseract OCR"""
        img = Image.open(image_path)
        
        # Get detailed data with bounding boxes
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        
        blocks = []
        full_text = []
        
        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            if text:
                blocks.append({
                    'text': text,
                    'confidence': float(data['conf'][i]) / 100.0,
                    'bbox': {
                        'x': int(data['left'][i]),
                        'y': int(data['top'][i]),
                        'width': int(data['width'][i]),
                        'height': int(data['height'][i])
                    }
                })
                full_text.append(text)
        
        return {
            'success': True,
            'text': ' '.join(full_text),
            'blocks': blocks,
            'engine': 'tesseract'
        }


def main():
    """Main entry point for CLI usage"""
    # Set UTF-8 encoding for stdout to handle Vietnamese and other Unicode characters
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ocr_service.py <image_path> [languages]'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    languages = sys.argv[2:] if len(sys.argv) > 2 else None
    
    if not Path(image_path).exists():
        print(json.dumps({
            'success': False,
            'error': f'Image file not found: {image_path}'
        }))
        sys.exit(1)
    
    ocr = OCRService()
    result = ocr.process_image(image_path, languages)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
