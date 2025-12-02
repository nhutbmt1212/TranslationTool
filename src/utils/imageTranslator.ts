import { ApiKeyManager } from './apiKeyManager';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

interface TextRegion {
    text: string;
    translatedText: string;
    // 4 corners: top-left, top-right, bottom-right, bottom-left
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
}

interface TranslationResult {
    regions: TextRegion[];
    success: boolean;
    error?: string;
}

/**
 * Convert image to base64 without resizing
 * Keep original dimensions for accurate coordinate detection
 */
export async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            resolve(base64);
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Call Gemini API to detect and translate text in image
 */
export async function detectAndTranslateText(
    imageBase64: string,
    sourceLang: string = 'en',
    targetLang: string = 'vi'
): Promise<TranslationResult> {
    const apiKey = await ApiKeyManager.getApiKey();
    
    if (!apiKey) {
        return {
            success: false,
            error: 'API key not found. Please configure in Settings.',
            regions: [],
        };
    }

    const prompt = `You are an expert OCR system with PIXEL-PERFECT accuracy. Your task:

1. DETECT every text region in this image
2. TRANSLATE from ${sourceLang} to ${targetLang}
3. Return EXACT pixel coordinates for bounding boxes

⚠️ ACCURACY IS CRITICAL ⚠️
- Measure coordinates with MAXIMUM PRECISION
- Use the ACTUAL pixel positions you see in the image
- Double-check every coordinate before returning
- The bounding box must PERFECTLY cover the text (not too small, not too large)

📐 COORDINATE RULES:
- Image origin (0,0) is at TOP-LEFT corner
- X increases LEFT → RIGHT
- Y increases TOP → BOTTOM
- All coordinates must be INTEGERS (whole numbers)
- Provide 4 corners: topLeft, topRight, bottomRight, bottomLeft (clockwise order)

📝 TEXT DETECTION RULES:
- Detect ALL text (titles, labels, body text, small text, everything)
- Each separate text block = separate region
- Don't merge text from different lines or sections
- Measure TIGHT bounding boxes (minimal padding)

🎯 OUTPUT FORMAT (PURE JSON, NO MARKDOWN):
[
  {
    "text": "exact original text",
    "translatedText": "exact translation",
    "topLeft": {"x": 100, "y": 50},
    "topRight": {"x": 300, "y": 50},
    "bottomRight": {"x": 300, "y": 80},
    "bottomLeft": {"x": 100, "y": 80}
  }
]

⚠️ CRITICAL: Return ONLY the JSON array. NO markdown blocks, NO explanations, NO extra text.
Return [] if no text is found.`;

    // Retry logic for 503 errors
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: imageBase64,
                                    },
                                },
                            ],
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                
                // Retry on 503 (Service Unavailable)
                if (response.status === 503 && attempt < maxRetries) {
                    console.log(`Attempt ${attempt} failed with 503, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
                    continue;
                }
                
                throw new Error(`API error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No response from Gemini');
            }

            // Parse JSON from response (handle markdown code blocks)
            let jsonText = textContent.trim();
            
            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Extract JSON array
            const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('Failed to parse response:', textContent);
                throw new Error('Invalid JSON response from Gemini');
            }

            const regions: TextRegion[] = JSON.parse(jsonMatch[0]);

            return {
                success: true,
                regions,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            
            // Don't retry on non-503 errors
            if (!lastError.message.includes('503')) {
                break;
            }
        }
    }

    // All retries failed
    console.error('Translation error after retries:', lastError);
    return {
        success: false,
        error: lastError?.message || 'Unknown error',
        regions: [],
    };
}

/**
 * Draw translated text on canvas with semi-transparent background
 */
export async function replaceTextInImage(
    imageFile: File,
    regions: TextRegion[]
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Process each text region
            regions.forEach((region) => {
                // Use coordinates directly (no scaling needed)
                const topLeft = region.topLeft;
                const topRight = region.topRight;
                const bottomRight = region.bottomRight;
                const bottomLeft = region.bottomLeft;

                // Draw polygon background to cover original text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.beginPath();
                ctx.moveTo(topLeft.x, topLeft.y);
                ctx.lineTo(topRight.x, topRight.y);
                ctx.lineTo(bottomRight.x, bottomRight.y);
                ctx.lineTo(bottomLeft.x, bottomLeft.y);
                ctx.closePath();
                ctx.fill();

                // Calculate bounding box dimensions
                const boxHeight = Math.abs(bottomLeft.y - topLeft.y);
                const boxWidth = Math.abs(topRight.x - topLeft.x);
                
                // Calculate optimal fontSize (60% of box height)
                const fontSize = Math.max(10, Math.floor(boxHeight * 0.6));

                // Setup text style with better font stack
                ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
                ctx.fillStyle = '#1a1a1a';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';

                // Smart word wrapping
                const words = region.translatedText.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                words.forEach((word) => {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const metrics = ctx.measureText(testLine);
                    
                    if (metrics.width > boxWidth - 8 && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Calculate starting Y position to center text vertically
                const totalTextHeight = lines.length * fontSize;
                let y = topLeft.y + (boxHeight - totalTextHeight) / 2 + fontSize / 2;

                // Draw each line
                lines.forEach((line) => {
                    ctx.fillText(line, topLeft.x + 4, y);
                    y += fontSize;
                });
            });

            // Convert canvas to data URL
            const resultImage = canvas.toDataURL('image/png');
            resolve(resultImage);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(imageFile);
    });
}
