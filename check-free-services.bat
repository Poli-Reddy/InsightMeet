@echo off
echo ========================================
echo Checking Free Analysis Services
echo ========================================
echo.

echo Docker Containers:
docker-compose ps
echo.

echo ========================================
echo Service Health Checks:
echo ========================================
echo.

echo Checking Whisper Service (http://localhost:8001)...
curl -s http://localhost:8001/health
echo.
echo.

echo Checking Diarization Service (http://localhost:8002)...
curl -s http://localhost:8002/health
echo.
echo.

echo ========================================
echo Service Logs (last 20 lines):
echo ========================================
echo.

echo --- Whisper Service ---
docker-compose logs --tail=20 whisper
echo.

echo --- Diarization Service ---
docker-compose logs --tail=20 diarization
echo.

pause
