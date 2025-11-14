@echo off
echo ========================================
echo Starting Free Analysis Services
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Starting Python microservices with Docker Compose...
echo.

docker-compose up -d

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo.
echo Whisper Service: http://localhost:8001
echo Diarization Service: http://localhost:8002
echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo.
echo Checking service health...
echo.

REM Check Whisper service
curl -s http://localhost:8001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Whisper service is running
) else (
    echo [WAIT] Whisper service is starting... (may take 1-2 minutes)
)

REM Check Diarization service
curl -s http://localhost:8002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Diarization service is running
) else (
    echo [WAIT] Diarization service is starting... (may take 1-2 minutes)
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now use Free Mode in the application.
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.
pause
