import sys
import os
import shutil
import ctypes

def create_shortcut(target, shortcut_path, working_dir):
    # Utilisation de PowerShell pour créer un raccourci Windows propre
    ps_command = f"$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('{shortcut_path}'); $Shortcut.TargetPath = '{target}'; $Shortcut.WorkingDirectory = '{working_dir}'; $Shortcut.Save()"
    os.system(f'powershell -Command "{ps_command}"')

def main():
    # Détection du dossier temporaire de PyInstaller contenant les fichiers embarqués
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    app_files_src = os.path.join(base_path, "AppFiles")
    install_dir = os.path.join(os.environ["LOCALAPPDATA"], "RoYout")
    
    try:
        # Suppression de l'ancienne version s'il y en a une
        if os.path.exists(install_dir):
            shutil.rmtree(install_dir, ignore_errors=True)
            
        # Copie des fichiers de l'application dans le répertoire d'installation
        shutil.copytree(app_files_src, install_dir)
        
        # Création du raccourci sur le Bureau
        desktop = os.path.join(os.environ["USERPROFILE"], "Desktop")
        shortcut_path = os.path.join(desktop, "RoYout.lnk")
        target_exe = os.path.join(install_dir, "RoYout.exe")
        
        create_shortcut(target_exe, shortcut_path, install_dir)
        
        # Lancement automatique de l'application après installation
        os.startfile(target_exe)
        
    except Exception as e:
        # Affichage d'une boîte de dialogue d'erreur native en cas de problème
        ctypes.windll.user32.MessageBoxW(0, f"Erreur lors de l'installation : {str(e)}", "Erreur d'installation RoYout", 16)
        sys.exit(1)

if __name__ == "__main__":
    main()
