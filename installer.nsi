; Script NSIS pour RoYout
; NSIS est nativement disponible sur les runners GitHub Actions

!include "MUI2.nsh"

Name "RoYout"
OutFile "RoYout_Setup.exe"
InstallDir "$PROGRAMFILES64\RoYout"
InstallDirRegKey HKCU "Software\RoYout" ""
RequestExecutionLevel admin

; Interface
!define MUI_ABORTWARNING
!define MUI_ICON "AppFiles\ui\logo.ico"
!define MUI_UNICON "AppFiles\ui\logo.ico"

; Pages de l'assistant d'installation
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Pages de désinstallation
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "French"

Section "Installation" SecMain
    SetOutPath "$INSTDIR"
    File /r "AppFiles\*"

    ; Créer le raccourci Bureau
    CreateShortcut "$DESKTOP\RoYout.lnk" "$INSTDIR\RoYout.exe"
    ; Créer raccourci Menu Démarrer
    CreateDirectory "$SMPROGRAMS\RoYout"
    CreateShortcut "$SMPROGRAMS\RoYout\RoYout.lnk" "$INSTDIR\RoYout.exe"
    CreateShortcut "$SMPROGRAMS\RoYout\Désinstaller.lnk" "$INSTDIR\uninstall.exe"

    ; Enregistrer la désinstallation dans Windows
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout" "DisplayName" "RoYout"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout" "DisplayVersion" "1.0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout" "Publisher" "ROY INDUSTRIE"
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\*"
    RMDir /r "$INSTDIR"
    Delete "$DESKTOP\RoYout.lnk"
    RMDir /r "$SMPROGRAMS\RoYout"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RoYout"
    DeleteRegKey HKCU "Software\RoYout"
SectionEnd
