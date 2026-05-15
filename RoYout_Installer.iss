; Script Inno Setup ultra-robuste pour RoYout
#define MyAppName "RoYout"
#define MyAppVersion "1.0"
#define MyAppPublisher "ROY INDUSTRIE"
#define MyAppExeName "RoYout.exe"

[Setup]
AppId={{C6A3545C-E03B-444F-9DA4-A372BB04ED40}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=RoYout_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=ui\logo.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "dist\RoYout\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "ffmpeg.exe"; DestDir: "{app}\_internal"; Flags: ignoreversion
Source: "ffprobe.exe"; DestDir: "{app}\_internal"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
