; Script Inno Setup pour RoYout
#define MyAppName "RoYout"
#define MyAppVersion "1.0"
#define MyAppPublisher "ROY INDUSTRIE"
#define MyAppExeName "RoYout.exe"
#define MyAppIconName "ui\logo.ico"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
AppId={{C6A3545C-E03B-444F-9DA4-A372BB04ED40}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
; Dossier de sortie du Setup.exe final
OutputDir=.
OutputBaseFilename=RoYout_Setup
SetupIconFile={#MyAppIconName}
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "RoYout_Files\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipfsentry
