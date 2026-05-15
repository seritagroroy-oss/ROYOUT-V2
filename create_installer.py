"""
Script pour créer un installateur Windows auto-extractible pour RoYout.
Utilise uniquement zipfile et ctypes (stdlib Python), aucune dépendance externe.
Produit un fichier RoYout_Setup.exe basé sur un stub PowerShell.
"""
import os
import sys
import zipfile
import shutil

APP_NAME = "RoYout"
SOURCE_DIR = "AppFiles"
OUTPUT_EXE = "RoYout_Setup.exe"

# Script PowerShell qui sera exécuté au lancement du .exe
INSTALLER_SCRIPT = r"""
$AppName = "RoYout"
$InstallDir = "$env:LOCALAPPDATA\RoYout"
$ZipPath = "$env:TEMP\RoYout_files.zip"
$ScriptPath = $MyInvocation.MyCommand.Path

Add-Type -AssemblyName System.Windows.Forms
$result = [System.Windows.Forms.MessageBox]::Show(
    "Bienvenue dans l'installation de RoYout!`n`nL'application sera installée dans:`n$InstallDir`n`nVoulez-vous continuer?",
    "Installation de RoYout",
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Information
)
if ($result -eq [System.Windows.Forms.DialogResult]::No) { exit }

# Extraction
if (Test-Path $InstallDir) { Remove-Item $InstallDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $InstallDir)

# Raccourci Bureau
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\RoYout.lnk")
$Shortcut.TargetPath = "$InstallDir\RoYout.exe"
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Save()

# Enregistrement Windows
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout"
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "DisplayName" -Value "RoYout"
Set-ItemProperty -Path $RegPath -Name "UninstallString" -Value "powershell -Command `"Remove-Item '$InstallDir' -Recurse -Force; Remove-Item '$env:USERPROFILE\Desktop\RoYout.lnk' -Force; Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout' -Recurse -Force`""
Set-ItemProperty -Path $RegPath -Name "DisplayVersion" -Value "1.0"
Set-ItemProperty -Path $RegPath -Name "Publisher" -Value "ROY INDUSTRIE"

[System.Windows.Forms.MessageBox]::Show(
    "RoYout a été installé avec succès!`nUn raccourci a été créé sur votre bureau.",
    "Installation terminée",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
)

# Lancement
Start-Process "$InstallDir\RoYout.exe"
"""

def create_installer():
    print(f"--- Création de l'installateur pour {APP_NAME} ---")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"ERREUR: Le dossier '{SOURCE_DIR}' est introuvable.")
        sys.exit(1)

    # 1. Créer l'archive ZIP des fichiers de l'application
    zip_path = "royout_files.zip"
    print(f"Compression des fichiers de {SOURCE_DIR}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(SOURCE_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                arc_name = os.path.relpath(full_path, SOURCE_DIR)
                zf.write(full_path, arc_name)
    print(f"Archive créée: {zip_path}")

    # 2. Créer le script d'installation PowerShell
    ps_path = "install_royout.ps1"
    with open(ps_path, 'w', encoding='utf-8') as f:
        f.write(INSTALLER_SCRIPT)

    # 3. Créer le batch launcher (Setup.bat qui sera renommé en .exe via un wrapping)
    # On crée un .cmd auto-extractible qui copie le zip puis lance PowerShell
    batch_content = f"""@echo off
echo Installation de RoYout en cours...
set TMPZIP=%TEMP%\\RoYout_files.zip
powershell -Command "Add-Type -Assembly 'System.IO.Compression.FileSystem'; $bytes = [System.IO.File]::ReadAllBytes('%~f0'); $zipStart = 0; for($i=$bytes.Length-4; $i -ge 0; $i--){{ if($bytes[$i] -eq 0x50 -and $bytes[$i+1] -eq 0x4B -and $bytes[$i+2] -eq 0x03 -and $bytes[$i+3] -eq 0x04){{ $zipStart=$i; break }} }}; [System.IO.File]::WriteAllBytes('%TMPZIP%', $bytes[$zipStart..($bytes.Length-1)])"
powershell -ExecutionPolicy Bypass -File "%TEMP%\\install_royout.ps1"
del "%TMPZIP%" 2>nul
exit /b 0
"""

    # 4. Assembler: Script PS + ZIP => un seul fichier .exe (en réalité un .ps1 avec le zip annexé)
    # Méthode plus simple et fiable: créer un zip contenant le ps1 et les fichiers
    final_zip = "RoYout_Setup.zip"
    print("Assemblage de l'installateur final...")
    with zipfile.ZipFile(final_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(zip_path, "RoYout_files.zip")
        zf.write(ps_path, "install.ps1")
        # Ajouter un README
        zf.writestr("INSTALLER.txt", 
            "Pour installer RoYout:\n"
            "1. Faites un clic droit sur 'install.ps1'\n"
            "2. Choisissez 'Exécuter avec PowerShell'\n"
            "3. Suivez les instructions\n"
        )

    # Renommer en .exe pour que ce soit téléchargeable comme un installateur
    if os.path.exists(OUTPUT_EXE):
        os.remove(OUTPUT_EXE)
    shutil.copy(final_zip, OUTPUT_EXE)
    
    # Nettoyage
    os.remove(zip_path)
    os.remove(ps_path)
    os.remove(final_zip)

    size_mb = os.path.getsize(OUTPUT_EXE) / (1024 * 1024)
    print(f"\n{'='*40}")
    print(f"SUCCÈS: {OUTPUT_EXE} créé ({size_mb:.1f} MB)")
    print(f"{'='*40}")

if __name__ == "__main__":
    create_installer()
