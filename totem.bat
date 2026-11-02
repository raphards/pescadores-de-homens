@echo off
REM ---------------------------------------------------------------
REM  Pescadores de Homens — modo totem (Windows + Chrome kiosk)
REM  Rode "npm install" e "npm run build" uma vez antes.
REM ---------------------------------------------------------------
cd /d "%~dp0"

start "" /min cmd /c "npx vite preview --port 4173 --strictPort"
timeout /t 4 >nul

set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

start "" %CHROME% --kiosk http://localhost:4173 --window-size=1080,1920 --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0
