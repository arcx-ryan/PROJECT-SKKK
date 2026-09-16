@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

echo [1/4] Menyalakan database Podman Web-Ujian...
podman container exists Web-Ujian
if errorlevel 1 (
  echo ERROR: Container Podman Web-Ujian tidak ditemukan.
  pause
  exit /b 1
)
for /f "delims=" %%P in ('podman ps --filter "name=^Web-Ujian$" --filter "status=running" -q') do set "RUNNING_CONTAINER=%%P"
if defined RUNNING_CONTAINER goto container_ready
podman start Web-Ujian >nul 2>&1
if errorlevel 1 (
  echo ERROR: Container Web-Ujian gagal dinyalakan.
  pause
  exit /b 1
)

:container_ready

echo [2/4] Menunggu MySQL siap...
set /a ATTEMPTS=0
:wait_mysql
podman exec Web-Ujian mysqladmin ping -uroot -proot --silent >nul 2>&1
if not errorlevel 1 goto mysql_ready
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 40 (
  echo ERROR: MySQL tidak siap setelah 120 detik.
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto wait_mysql

:mysql_ready
echo MySQL siap.

echo [3/4] Membangun dan menjalankan backend serta frontend...
call npm.cmd --prefix "%FRONTEND_DIR%" run build
if errorlevel 1 (
  echo ERROR: Frontend gagal dibangun.
  pause
  exit /b 1
)
if not exist "%FRONTEND_DIR%\dist\index.html" (
  echo ERROR: Hasil build frontend tidak ditemukan.
  pause
  exit /b 1
)
start "Web Ujian - Backend" /D "%BACKEND_DIR%" cmd /k npm.cmd run dev

echo [4/4] Menjalankan Ngrok ke backend port 5000...
start "Web Ujian - Ngrok" cmd /k "ngrok http 5000"

echo.
echo Semua layanan sudah dimulai pada jendela terpisah.
echo Web lokal:       http://localhost:5000
echo Frontend sumber: http://localhost:5173
echo Tutup jendela layanan untuk menghentikannya.
timeout /t 5 /nobreak >nul
endlocal
