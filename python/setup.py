#!/usr/bin/env python3
"""
Setup script to create virtual environment and install dependencies
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Setup Python environment for OCR service"""
    script_dir = Path(__file__).parent
    venv_dir = script_dir / 'venv'
    
    print("🔧 Setting up Python OCR environment...")
    
    # Create virtual environment
    if not venv_dir.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', str(venv_dir)], check=True)
    
    # Determine pip path
    if os.name == 'nt':  # Windows
        pip_path = venv_dir / 'Scripts' / 'pip.exe'
        python_path = venv_dir / 'Scripts' / 'python.exe'
    else:  # Unix/Linux/Mac
        pip_path = venv_dir / 'bin' / 'pip'
        python_path = venv_dir / 'bin' / 'python'
    
    # Upgrade pip
    print("⬆️  Upgrading pip...")
    subprocess.run([str(python_path), '-m', 'pip', 'install', '--upgrade', 'pip'], check=True)
    
    # Install dependencies
    print("📥 Installing dependencies...")
    requirements_file = script_dir / 'requirements.txt'
    subprocess.run([str(pip_path), 'install', '-r', str(requirements_file)], check=True)
    
    print("✅ Python OCR environment setup complete!")
    print(f"   Python: {python_path}")
    print(f"   To activate: source {venv_dir}/bin/activate (Unix) or {venv_dir}\\Scripts\\activate (Windows)")

if __name__ == '__main__':
    main()
