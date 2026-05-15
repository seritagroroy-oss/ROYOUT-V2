import os
import sys

def check_paths():
    cwd = os.getcwd()
    print(f"Current Working Directory: {cwd}")
    
    react_dist = os.path.join(cwd, 'frontend-react', 'dist', 'index.html')
    print(f"Checking for React Dist: {react_dist}")
    print(f"Exists: {os.path.exists(react_dist)}")
    
    legacy_ui = os.path.join(cwd, 'ui', 'index.html')
    print(f"Checking for Legacy UI: {legacy_ui}")
    print(f"Exists: {os.path.exists(legacy_ui)}")
    
    if os.path.exists(react_dist):
        with open(react_dist, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"React Dist Content Length: {len(content)}")
            print("First 100 chars:", content[:100])

if __name__ == "__main__":
    check_paths()
