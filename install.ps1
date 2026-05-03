# Script d'installation pour RoYout
$AppName = "RoYout"
$AppDir = "$env:LOCALAPPDATA\$AppName"
$SourceDir = "dist\RoYout"
$ExeName = "RoYout.exe"
$ShortcutName = "RoYout.lnk"
$IconPath = "$AppDir\ui\logo.ico"

Write-Host "--- Installation de $AppName ---" -ForegroundColor Cyan

# 1. Vérifier que l'application a été compilée
if (-not (Test-Path $SourceDir)) {
    Write-Host "Erreur : Le dossier de compilation '$SourceDir' est introuvable." -ForegroundColor Red
    Write-Host "Veuillez d'abord lancer 'python package.py'."
    exit
}

# 2. Créer le dossier d'installation
if (Test-Path $AppDir) {
    Write-Host "Mise à jour de la version existante..."
    Remove-Item -Path $AppDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null

# 3. Copier les fichiers
Write-Host "Copie des fichiers vers $AppDir..."
Copy-Item -Path "$SourceDir\*" -Destination $AppDir -Recurse -Force

# 4. Créer le raccourci sur le bureau
Write-Host "Création du raccourci sur le bureau..."
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\$ShortcutName")
$Shortcut.TargetPath = "$AppDir\$ExeName"
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

# 5. Enregistrer dans Windows (Désinstallation)
Write-Host "Enregistrement dans le système..."
$UninstallPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
if (-not (Test-Path $UninstallPath)) {
    New-Item -Path $UninstallPath -Force | Out-Null
}
Set-ItemProperty -Path $UninstallPath -Name "DisplayName" -Value $AppName
Set-ItemProperty -Path $UninstallPath -Name "DisplayIcon" -Value $IconPath
Set-ItemProperty -Path $UninstallPath -Name "UninstallString" -Value "powershell.exe -Command `"Remove-Item -Path '$AppDir' -Recurse -Force; Remove-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName' -Force; Remove-Item -Path '$env:USERPROFILE\Desktop\$ShortcutName' -Force`""
Set-ItemProperty -Path $UninstallPath -Name "DisplayVersion" -Value "1.0.0"
Set-ItemProperty -Path $UninstallPath -Name "Publisher" -Value "ROY INDUSTRIE"

Write-Host "`nInstallation terminée avec succès !" -ForegroundColor Green
Write-Host "Vous trouverez RoYout sur votre bureau."
