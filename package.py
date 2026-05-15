import os
import subprocess
import sys
import shutil

def package():
    print("--- Préparation du packaging de RoYout ---")
    
    # 1. Installation de PyInstaller si nécessaire
    try:
        import PyInstaller
        print("PyInstaller est déjà présent.")
    except ImportError:
        print("Installation de PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. Nettoyage des anciens builds
    for folder in ['build', 'dist']:
        if os.path.exists(folder):
            print(f"Nettoyage de {folder}...")
            shutil.rmtree(folder)

    print("\n--- Lancement de la compilation ---")
    
    # Construction de la commande
    # On utilise ; pour séparer les dossiers sur Windows pour --add-data
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--icon=ui/logo.ico",
        "--name=RoYout",
        "--add-data=ui;ui",
        "--add-data=ffmpeg.exe;.",
        "--add-data=ffprobe.exe;.",
        "main.py"
    ]
    
    try:
        subprocess.check_call(cmd)
        print("\n" + "="*40)
        print("SUCCÈS : L'application est prête !")
        print("Dossier : " + os.path.abspath("dist/RoYout"))
        print("Exécutable : RoYout.exe")
        print("="*40)
    except Exception as e:
        print(f"\nERREUR critique lors du packaging : {e}")
        sys.exit(1) # Informe GitHub que la compilation a échoué

if __name__ == "__main__":
    package()
