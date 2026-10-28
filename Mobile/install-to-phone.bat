@echo off
rem Installs dist\Vateko.fun.apk on a phone connected by USB (USB debugging on). No website needed.
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
set "APK=%~dp0dist\Vateko.fun.apk"
if not exist "%APK%" (echo APK not found: %APK% & pause & exit /b 1)
"%ADB%" devices
"%ADB%" install -r "%APK%"
if errorlevel 1 (echo Install failed. Check USB debugging is on and the phone is unlocked. & pause & exit /b 1)
echo Installed. Open Vateko.fun on the phone.
pause
