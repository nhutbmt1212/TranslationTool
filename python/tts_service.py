#!/usr/bin/env python3
"""
Text-to-Speech Service using edge-tts
Free, high quality, 300+ voices, 40+ languages
"""

import sys
import json
import asyncio
import tempfile
import os
from pathlib import Path

try:
    import edge_tts
    TTS_ENGINE = 'edge-tts'
except ImportError:
    TTS_ENGINE = None

# Voice mapping - edge-tts voices based on languages.json codes
# Using Female voices where available for natural sound
VOICE_MAP = {
    # From languages.json
    'af': 'af-ZA-AdriNeural',        # Afrikaans
    'am': 'am-ET-MekdesNeural',      # Amharic
    'ar': 'ar-SA-ZariyahNeural',     # Arabic
    'az': 'az-AZ-BanuNeural',        # Azerbaijani
    'bg': 'bg-BG-KalinaNeural',      # Bulgarian
    'bn': 'bn-IN-TanishaaNeural',    # Bengali
    'bs': 'bs-BA-VesnaNeural',       # Bosnian
    'ca': 'ca-ES-JoanaNeural',       # Catalan
    'cs': 'cs-CZ-VlastaNeural',      # Czech
    'cy': 'cy-GB-NiaNeural',         # Welsh
    'da': 'da-DK-ChristelNeural',    # Danish
    'de': 'de-DE-KatjaNeural',       # German
    'el': 'el-GR-AthinaNeural',      # Greek
    'en': 'en-US-JennyNeural',       # English
    'es': 'es-ES-ElviraNeural',      # Spanish
    'et': 'et-EE-AnuNeural',         # Estonian
    'fa': 'fa-IR-DilaraNeural',      # Persian
    'fi': 'fi-FI-NooraNeural',       # Finnish
    'fil': 'fil-PH-BlessicaNeural',  # Filipino
    'fr': 'fr-FR-DeniseNeural',      # French
    'ga': 'ga-IE-OrlaNeural',        # Irish
    'gl': 'gl-ES-SabelaNeural',      # Galician
    'gu': 'gu-IN-DhwaniNeural',      # Gujarati
    'he': 'he-IL-HilaNeural',        # Hebrew
    'hi': 'hi-IN-SwaraNeural',       # Hindi
    'hr': 'hr-HR-GabrijelaNeural',   # Croatian
    'hu': 'hu-HU-NoemiNeural',       # Hungarian
    'hy': 'hy-AM-AnahitNeural',      # Armenian
    'id': 'id-ID-GadisNeural',       # Indonesian
    'is': 'is-IS-GudrunNeural',      # Icelandic
    'it': 'it-IT-ElsaNeural',        # Italian
    'ja': 'ja-JP-NanamiNeural',      # Japanese
    'jv': 'jv-ID-SitiNeural',        # Javanese
    'ka': 'ka-GE-EkaNeural',         # Georgian
    'kk': 'kk-KZ-AigulNeural',       # Kazakh
    'km': 'km-KH-SresymomNeural',    # Khmer
    'kn': 'kn-IN-SapnaNeural',       # Kannada
    'ko': 'ko-KR-SunHiNeural',       # Korean
    'lo': 'lo-LA-KeomanyNeural',     # Lao
    'lt': 'lt-LT-OnaNeural',         # Lithuanian
    'lv': 'lv-LV-EveritaNeural',     # Latvian
    'mk': 'mk-MK-MarijaNeural',      # Macedonian
    'ml': 'ml-IN-SobhanaNeural',     # Malayalam
    'mn': 'mn-MN-YesunNeural',       # Mongolian
    'mr': 'mr-IN-AarohiNeural',      # Marathi
    'ms': 'ms-MY-YasminNeural',      # Malay
    'mt': 'mt-MT-GraceNeural',       # Maltese
    'my': 'my-MM-NilarNeural',       # Myanmar (Burmese)
    'ne': 'ne-NP-HemkalaNeural',     # Nepali
    'nl': 'nl-NL-ColetteNeural',     # Dutch
    'no': 'nb-NO-PernilleNeural',    # Norwegian
    'pl': 'pl-PL-ZofiaNeural',       # Polish
    'ps': 'ps-AF-LatifaNeural',      # Pashto
    'pt': 'pt-BR-FranciscaNeural',   # Portuguese
    'ro': 'ro-RO-AlinaNeural',       # Romanian
    'ru': 'ru-RU-SvetlanaNeural',    # Russian
    'si': 'si-LK-ThiliniNeural',     # Sinhala
    'sk': 'sk-SK-ViktoriaNeural',    # Slovak
    'sl': 'sl-SI-PetraNeural',       # Slovenian
    'so': 'so-SO-UbaxNeural',        # Somali
    'sq': 'sq-AL-AnilaNeural',       # Albanian
    'sr': 'sr-RS-SophieNeural',      # Serbian
    'su': 'su-ID-TutiNeural',        # Sundanese
    'sv': 'sv-SE-SofieNeural',       # Swedish
    'sw': 'sw-KE-ZuriNeural',        # Swahili
    'ta': 'ta-IN-PallaviNeural',     # Tamil
    'te': 'te-IN-ShrutiNeural',      # Telugu
    'th': 'th-TH-PremwadeeNeural',   # Thai
    'tl': 'fil-PH-BlessicaNeural',   # Tagalog (use Filipino)
    'tr': 'tr-TR-EmelNeural',        # Turkish
    'uk': 'uk-UA-PolinaNeural',      # Ukrainian
    'ur': 'ur-PK-UzmaNeural',        # Urdu
    'uz': 'uz-UZ-MadinaNeural',      # Uzbek
    'vi': 'vi-VN-HoaiMyNeural',      # Vietnamese
    'zh': 'zh-CN-XiaoxiaoNeural',    # Chinese (Simplified)
    'zh-TW': 'zh-TW-HsiaoChenNeural', # Chinese (Traditional)
    'zu': 'zu-ZA-ThandoNeural',      # Zulu
}


class TTSService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    async def synthesize(self, text: str, lang: str, output_path: str = None) -> dict:
        """
        Synthesize text to speech
        
        Args:
            text: Text to speak
            lang: Language code (e.g., 'en', 'vi', 'ja')
            output_path: Optional output file path
            
        Returns:
            Dict with success status and audio file path
        """
        if TTS_ENGINE is None:
            return {
                'success': False,
                'error': 'edge-tts not installed. Run: pip install edge-tts'
            }
        
        try:
            # Get voice for language
            voice = VOICE_MAP.get(lang, VOICE_MAP.get('en'))
            
            if not voice:
                return {
                    'success': False,
                    'error': f'Language "{lang}" is not supported'
                }
            
            # Generate output path if not provided
            if not output_path:
                output_path = os.path.join(self.temp_dir, f'tts_output_{os.getpid()}.mp3')
            
            # Create TTS communicate object
            communicate = edge_tts.Communicate(text, voice)
            
            # Save to file
            await communicate.save(output_path)
            
            return {
                'success': True,
                'audio_path': output_path,
                'voice': voice,
                'engine': 'edge-tts'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_supported_languages(self) -> list:
        """Get list of supported language codes"""
        return list(set(VOICE_MAP.keys()))


async def main():
    """Main entry point for CLI usage"""
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python tts_service.py <text> <language> [output_path]'
        }))
        sys.exit(1)
    
    text = sys.argv[1]
    lang = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    tts = TTSService()
    result = await tts.synthesize(text, lang, output_path)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    asyncio.run(main())
