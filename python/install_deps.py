#!/usr/bin/env python3
"""
Auto-install Python dependencies for OCR service
This script is called automatically when Python OCR is first used
"""

import subprocess
import sys
import json

def install_dependencies():
    """Install required packages using pip"""
    packages = [
        'easyocr>=1.7.0',
        'torch>=2.0.0',
        'torchvision>=0.15.0',
    ]
    
    try:
        # Upgrade pip first
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Install packages
        for package in packages:
            print(f"Installing {package}...", file=sys.stderr)
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print(json.dumps({'success': True, 'message': 'Dependencies installed'}))
        return True
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        return False

if __name__ == '__main__':
    install_dependencies()
