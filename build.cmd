@echo off
REM ============================================================
REM  GameCraft Studio - Lanceur de build Windows
REM  Desactive la signature de code (inutile en local) pour
REM  eviter le telechargement/extraction de winCodeSign qui
REM  echoue sans privileges administrateur (symlinks macOS).
REM ============================================================
setlocal
set "CSC_IDENTITY_AUTO_DISCOVERY=false"
set "ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true"
echo [build.cmd] CSC_IDENTITY_AUTO_DISCOVERY=%CSC_IDENTITY_AUTO_DISCOVERY%
where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\node.exe" set "PATH=%PATH%;C:\Program Files\nodejs"
)
call npx electron-builder %*
endlocal
