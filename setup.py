import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

if __name__ == "__main__":
    print("Installation des dépendances pour RoYout...")
    try:
        # Pour Python 3.14+, nous avons besoin d'une version spécifique de pythonnet
        if sys.version_info >= (3, 14):
            print("Détection de Python 3.14+, installation de pythonnet rc...")
            install("pythonnet==3.1.0rc0")
        
        install("pywebview")
        install("yt-dlp")
        print("\nInstallation terminée avec succès !")
        print("Vous pouvez maintenant lancer l'application avec : python main.py")
    except Exception as e:
        print(f"\nErreur lors de l'installation : {e}")
