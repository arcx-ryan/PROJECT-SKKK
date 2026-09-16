@echo off
setlocal

echo [1/4] Menghentikan backend Web Ujian...
taskkill /FI "WINDOWTITLE eq Web Ujian - Backend*" /T /F >nul 2>&1

echo [2/4] Menghentikan frontend Web Ujian...
taskkill /FI "WINDOWTITLE eq Web Ujian - Frontend*" /T /F >nul 2>&1

echo [3/4] Menghentikan Ngrok Web Ujian...
taskkill /FI "WINDOWTITLE eq Web Ujian - Ngrok*" /T /F >nul 2>&1

echo [4/4] Menghentikan database Podman Web-Ujian...
where podman >nul 2>&1
if errorlevel 1 (
  echo PERINGATAN: Perintah podman tidak ditemukan. Database tidak dihentikan.
  goto done
)

podman container exists Web-Ujian >nul 2>&1
if errorlevel 1 (
  echo Database Podman Web-Ujian tidak ditemukan.
  goto done
)

podman stop Web-Ujian >nul 2>&1
if errorlevel 1 (
  echo PERINGATAN: Database Web-Ujian sudah berhenti atau gagal dihentikan.
) else (
  echo Database Web-Ujian berhasil dihentikan.
)

:done
echo.
echo Layanan Web Ujian sudah dihentikan.
timeout /t 3 /nobreak >nul
endlocal
