@echo off
echo ==========================================
echo Healthy Scheduled - Android APK Builder
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak ditemukan. Instal Node.js LTS terlebih dahulu.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 goto fail
if not exist android (
  call npx cap add android
  if errorlevel 1 goto fail
)
call npx cap sync android
if errorlevel 1 goto fail
call npx cap open android
if errorlevel 1 goto fail
echo Android Studio dibuka. Lanjutkan Build APK melalui menu Build.
pause
exit /b 0
:fail
echo Ada perintah yang gagal. Periksa pesan di atas dan panduan README_BUILD_APK_ID.txt.
pause
