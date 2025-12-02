import { ApiKeyManager } from './apiKeyManager';
import { createWorker } from 'tesseract.js';

// Gemini model for translation only
const GEMINI_MODEL = 'gemini-2.0-flash';

interface Point {
    x: number;
    y: number;
}

interface TextRegion {
    text: string;
    translatedText: string;
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
}

interface TranslationResult {
    regions: TextRegion[];
    success: boolean;
    error?: string;
}

interface ImageInfo {
    base64: string;
    width: number;
    height: number;
}

/**
 * Convert image to base64 and return with dimensions
 */
export async function imageToBase64WithDimensions(file: File): Promise<ImageInfo> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            const img = new Image();
            img.onload = () => resolve({ base64, width: img.width, height: img.height });
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Detect text regions using Tesseract.js
 * Returns line-level bounding boxes for accurate detection
 */
async function detectTextWithTesseract(imageFile: File): Promise<TextRegion[]> {
    const imageUrl = URL.createObjectURL(imageFile);
    
    try {
        console.log('Starting Tesseract OCR...');
        
        // Create worker
        const worker = await createWorker('eng', 1, {
            logger: (m: { status: string; progress: number }) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        const result = await worker.recognize(imageUrl);
        console.log('Tesseract result:', result);

        // Extract line-level bounding boxes
        const regions: TextRegion[] = [];
        const data = result.data as any;
        
        if (data.lines) {
            data.lines.forEach((line: any) => {
                if (line.text.trim() && line.confidence > 30) {
                    const bbox = line.bbox;
                    regions.push({
                        text: line.text.trim(),
                        translatedText: '', // Will be filled by Gemini
                        topLeft: { x: bbox.x0, y: bbox.y0 },
                        topRight: { x: bbox.x1, y: bbox.y0 },
                        bottomRight: { x: bbox.x1, y: bbox.y1 },
                        bottomLeft: { x: bbox.x0, y: bbox.y1 },
                    });
                }
            });
        }

        await worker.terminate();
        console.log(`Detected ${regions.length} text regions`);
        return regions;
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}


/**
 * Crop a region from image and return as base64
 */
async function cropRegion(
    imageFile: File,
    region: TextRegion,
    padding: number = 5
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target?.result as string; };
        reader.onerror = () => reject(new Error('Failed to read file'));

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }

            // Calculate crop area with padding
            const x = Math.max(0, region.topLeft.x - padding);
            const y = Math.max(0, region.topLeft.y - padding);
            const width = Math.min(img.width - x, region.topRight.x - region.topLeft.x + padding * 2);
            const height = Math.min(img.height - y, region.bottomLeft.y - region.topLeft.y + padding * 2);

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            // Return base64 without data URL prefix
            resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Use Gemini to read text from cropped image regions and translate
 */
async function readAndTranslateWithGemini(
    imageFile: File,
    regions: TextRegion[],
    sourceLang: string,
    targetLang: string
): Promise<string[]> {
    const apiKey = await ApiKeyManager.getApiKey();
    if (!apiKey) throw new Error('API key not found');

    // Crop all regions
    console.log('Cropping regions for Gemini...');
    const croppedImages = await Promise.all(
        regions.map(region => cropRegion(imageFile, region))
    );

    // Build parts array with all cropped images
    const imageParts = croppedImages.map((base64, i) => ({
        inline_data: {
            mime_type: 'image/png',
            data: base64,
        },
        _index: i, // For reference
    }));

    const prompt = `You are given ${regions.length} cropped text images. For each image:
1. Read the text accurately
2. Translate from ${sourceLang} to ${targetLang}

Return ONLY a JSON array with translations in order:
["translation1", "translation2", ...]

Important:
- Return exactly ${regions.length} translations
- Keep the same order as the images
- If text is unclear, make your best guess`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        ...imageParts.map(p => ({ inline_data: p.inline_data })),
                    ],
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
            }),
        }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) throw new Error('No response from Gemini');

    console.log('Gemini response:', textContent);

    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid translation response');

    return JSON.parse(jsonMatch[0]);
}

/**
 * Main function: Detect text with Tesseract + Translate with Gemini
 */
export async function detectAndTranslateText(
    _imageBase64: string,
    sourceLang: string = 'en',
    targetLang: string = 'vi',
    _imageWidth?: number,
    _imageHeight?: number,
    imageFile?: File
): Promise<TranslationResult> {
    try {
        if (!imageFile) {
            return { success: false, error: 'Image file required', regions: [] };
        }

        // Step 1: Detect text with Tesseract.js
        console.log('Detecting text with Tesseract.js...');
        const regions = await detectTextWithTesseract(imageFile);

        if (regions.length === 0) {
            return { success: true, regions: [] };
        }

        // Step 2: Send cropped regions to Gemini for accurate OCR + translation
        console.log('Sending cropped regions to Gemini for OCR + translation...');
        
        const translations = await readAndTranslateWithGemini(imageFile, regions, sourceLang, targetLang);
        console.log('Translations:', translations);

        // Step 3: Combine bbox + translations
        regions.forEach((region, i) => {
            region.translatedText = translations[i] || region.text;
        });

        return { success: true, regions };
    } catch (error) {
        console.error('Detection/Translation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            regions: [],
        };
    }
}


/**
 * Draw white boxes over detected text regions (debug mode)
 */
export async function replaceTextWithBoxes(
    imageFile: File,
    regions: TextRegion[]
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target?.result as string; };
        reader.onerror = () => reject(new Error('Failed to read file'));

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw white boxes
            regions.forEach((region) => {
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.beginPath();
                ctx.moveTo(region.topLeft.x, region.topLeft.y);
                ctx.lineTo(region.topRight.x, region.topRight.y);
                ctx.lineTo(region.bottomRight.x, region.bottomRight.y);
                ctx.lineTo(region.bottomLeft.x, region.bottomLeft.y);
                ctx.closePath();
                ctx.fill();
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Replace text in image with translations
 */
export async function replaceTextInImage(
    imageFile: File,
    regions: TextRegion[],
    debugMode: boolean = false
): Promise<string> {
    if (debugMode) return replaceTextWithBoxes(imageFile, regions);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target?.result as string; };
        reader.onerror = () => reject(new Error('Failed to read file'));

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            regions.forEach((region) => {
                // Draw white background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.beginPath();
                ctx.moveTo(region.topLeft.x, region.topLeft.y);
                ctx.lineTo(region.topRight.x, region.topRight.y);
                ctx.lineTo(region.bottomRight.x, region.bottomRight.y);
                ctx.lineTo(region.bottomLeft.x, region.bottomLeft.y);
                ctx.closePath();
                ctx.fill();

                // Calculate dimensions
                const boxHeight = Math.abs(region.bottomLeft.y - region.topLeft.y);
                const boxWidth = Math.abs(region.topRight.x - region.topLeft.x);
                const fontSize = Math.max(10, Math.floor(boxHeight * 0.7));

                // Draw translated text
                ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
                ctx.fillStyle = '#1a1a1a';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';

                // Word wrapping
                const words = region.translatedText.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                words.forEach((word) => {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    if (ctx.measureText(testLine).width > boxWidth - 8 && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Draw lines
                const totalTextHeight = lines.length * fontSize;
                let y = region.topLeft.y + (boxHeight - totalTextHeight) / 2 + fontSize / 2;
                lines.forEach((line) => {
                    ctx.fillText(line, region.topLeft.x + 4, y);
                    y += fontSize;
                });
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(imageFile);
    });
}
