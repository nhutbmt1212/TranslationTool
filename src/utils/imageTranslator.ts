import { ApiKeyManager } from './apiKeyManager';
import { createWorker } from 'tesseract.js';
import { isPythonOCRAvailable, processImageWithPythonOCR, convertOCRBlocksToRegions } from './pythonOCR';

// Gemini model for translation (lite version for speed)
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

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
    fontSize: number; // Estimated font size from original text
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
        // Create worker
        const worker = await createWorker('eng', 1);

        const result = await worker.recognize(imageUrl);

        // Extract line-level bounding boxes
        const regions: TextRegion[] = [];
        const data = result.data as any;
        
        if (data.lines) {
            data.lines.forEach((line: any) => {
                if (line.text.trim() && line.confidence > 30) {
                    const bbox = line.bbox;
                    const lineHeight = bbox.y1 - bbox.y0;
                    
                    // Estimate font size from line height (typically ~80% of line height)
                    const estimatedFontSize = Math.round(lineHeight * 0.85);
                    
                    regions.push({
                        text: line.text.trim(),
                        translatedText: '', // Will be filled by Gemini
                        topLeft: { x: bbox.x0, y: bbox.y0 },
                        topRight: { x: bbox.x1, y: bbox.y0 },
                        bottomRight: { x: bbox.x1, y: bbox.y1 },
                        bottomLeft: { x: bbox.x0, y: bbox.y1 },
                        fontSize: estimatedFontSize,
                    });
                }
            });
        }

        await worker.terminate();
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
 * Use Gemini to translate text regions in ONE API call
 * More efficient than multiple calls - saves API quota and time
 */
async function readAndTranslateWithGemini(
    imageFile: File,
    regions: TextRegion[],
    sourceLang: string,
    targetLang: string
): Promise<string[]> {
    const apiKey = await ApiKeyManager.getApiKey();
    if (!apiKey) throw new Error('API key not found');

    console.log(`🔄 Translating ${regions.length} text regions in ONE API call...`);
    const startTime = Date.now();

    // Extract just the text from regions (Python OCR already detected text)
    const textsToTranslate = regions.map(r => r.text);

    const prompt = `You are a translation tool. I have ${regions.length} text snippets that need translation.

Source language: ${sourceLang}
Target language: ${targetLang}

Text snippets:
${textsToTranslate.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

IMPORTANT:
- Translate each text snippet accurately
- Preserve the meaning and context
- Return a JSON array with exactly ${regions.length} translated strings
- Keep the same order as input
- If a text is already in target language or empty, return it as-is

Return format: ["translation1", "translation2", ...]`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }],
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096, // Increased for more text
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) throw new Error('No response from Gemini');

    // Parse JSON response
    let translations: string[];
    try {
        translations = JSON.parse(textContent);
    } catch {
        // Fallback: extract JSON array from text
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Invalid translation response');
        translations = JSON.parse(jsonMatch[0]);
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ Translated ${regions.length} regions in ${elapsed}ms (${Math.round(elapsed / regions.length)}ms per region)`);

    return translations;
}

/**
 * Detect text using Python OCR (EasyOCR)
 * Faster and more accurate than Tesseract
 */
async function detectTextWithPythonOCR(imageFile: File): Promise<TextRegion[]> {
    // Use English + Vietnamese for best compatibility
    // EasyOCR has strict language compatibility rules - many Asian languages only work with English
    const result = await processImageWithPythonOCR(imageFile, ['en', 'vi']);
    
    if (!result.success || !result.blocks) {
        throw new Error(result.error || 'Python OCR failed');
    }
    
    return convertOCRBlocksToRegions(result.blocks);
}

/**
 * Main function: Detect text + Translate with Gemini
 * Uses Python OCR (EasyOCR) if available, falls back to Tesseract
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

        let regions: TextRegion[] = [];

        // Step 1: Try Python OCR first (faster and more accurate)
        const pythonOCRAvailable = await isPythonOCRAvailable();
        
        if (pythonOCRAvailable) {
            console.log('✅ Using Python OCR (EasyOCR)');
            try {
                regions = await detectTextWithPythonOCR(imageFile);
                console.log(`✅ Python OCR detected ${regions.length} text regions`);
            } catch (error) {
                console.warn('❌ Python OCR failed, falling back to Tesseract:', error);
                regions = await detectTextWithTesseract(imageFile);
            }
        } else {
            console.log('❌ Python OCR not available, using Tesseract');
            regions = await detectTextWithTesseract(imageFile);
        }

        if (regions.length === 0) {
            return { success: true, regions: [] };
        }

        // Step 2: Send cropped regions to Gemini for accurate OCR + translation
        console.log('🔄 Translating with Gemini...');
        const translations = await readAndTranslateWithGemini(imageFile, regions, sourceLang, targetLang);
        console.log('✅ Translation complete');

        // Step 3: Combine bbox + translations
        regions.forEach((region, i) => {
            region.translatedText = translations[i] || region.text;
        });

        return { success: true, regions };
    } catch (error) {
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
 * Simple approach: draw text in bounding box (works for both straight and rotated text)
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

            // Enable better text rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            regions.forEach((region) => {
                // Calculate bounding box dimensions
                const minX = Math.min(region.topLeft.x, region.topRight.x, region.bottomLeft.x, region.bottomRight.x);
                const maxX = Math.max(region.topLeft.x, region.topRight.x, region.bottomLeft.x, region.bottomRight.x);
                const minY = Math.min(region.topLeft.y, region.topRight.y, region.bottomLeft.y, region.bottomRight.y);
                const maxY = Math.max(region.topLeft.y, region.topRight.y, region.bottomLeft.y, region.bottomRight.y);
                
                const boxWidth = maxX - minX;
                const boxHeight = maxY - minY;
                
                // Draw solid white background (polygon shape)
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.beginPath();
                ctx.moveTo(region.topLeft.x, region.topLeft.y);
                ctx.lineTo(region.topRight.x, region.topRight.y);
                ctx.lineTo(region.bottomRight.x, region.bottomRight.y);
                ctx.lineTo(region.bottomLeft.x, region.bottomLeft.y);
                ctx.closePath();
                ctx.fill();

                // Start with original font size
                let fontSize = Math.max(10, Math.min(region.fontSize, boxHeight * 0.8));
                const fontFamily = 'Arial, "Noto Sans", sans-serif';
                
                // Function to split text into lines that fit
                const calculateLines = (size: number): string[] => {
                    ctx.font = `${size}px ${fontFamily}`;
                    const maxWidth = boxWidth - 4;
                    const words = region.translatedText.split(' ');
                    const lines: string[] = [];
                    let currentLine = '';

                    words.forEach((word) => {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    });
                    if (currentLine) lines.push(currentLine);
                    return lines;
                };

                // Auto-scale font to fit box
                let lines = calculateLines(fontSize);
                const lineSpacing = 1.15;
                while ((lines.length * fontSize * lineSpacing > boxHeight - 4) && fontSize > 8) {
                    fontSize -= 1;
                    lines = calculateLines(fontSize);
                }

                // Draw text
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';

                // Center text vertically
                const totalHeight = lines.length * fontSize * lineSpacing;
                let startY = minY + Math.max(2, (boxHeight - totalHeight) / 2);
                
                lines.forEach((line) => {
                    // Center text horizontally
                    const textWidth = ctx.measureText(line).width;
                    const startX = minX + Math.max(2, (boxWidth - textWidth) / 2);
                    
                    ctx.fillText(line, startX, startY);
                    startY += fontSize * lineSpacing;
                });
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(imageFile);
    });
}
