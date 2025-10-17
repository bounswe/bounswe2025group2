#!/usr/bin/env python
"""
Wrapper script to run the Django management command for creating forums.
This is the most reliable way to create forums.
"""

import os
import sys
import subprocess

def main():
    print("🚀 Creating 3 random forums using Django management command...")
    
    # Get the current directory (backend)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    genfit_django_dir = os.path.join(current_dir, 'genfit_django')
    
    # Change to the Django project directory
    os.chdir(genfit_django_dir)
    
    try:
        # Run the Django management command
        result = subprocess.run([
            sys.executable, 'manage.py', 'create_forums'
        ], check=True, capture_output=True, text=True)
        
        print("✅ Command executed successfully!")
        print(result.stdout)
        
        if result.stderr:
            print("Warnings/Errors:")
            print(result.stderr)
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running command: {e}")
        print(f"Return code: {e.returncode}")
        print(f"Error output: {e.stderr}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1
    
    print("\n🎉 Forums created successfully!")
    return 0

if __name__ == '__main__':
    exit(main())
