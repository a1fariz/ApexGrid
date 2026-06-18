@echo off
title ApexGrid — Start All Services
color 0A

echo.
echo  ============================================
echo   APEXGRID - Formula 1 Race Management
echo   Starting all services...
echo  ============================================
echo.

set ROOT=%~dp0

echo [1/4] Starting User Service (port 8082)...
start "User Service :8082" cmd /k "cd /d %ROOT%user-service && mvn spring-boot:run --no-transfer-progress < NUL"

timeout /t 3 /nobreak >nul

echo [2/4] Starting Race Service (port 8081)...
start "Race Service :8081" cmd /k "cd /d %ROOT%race-service && mvn spring-boot:run --no-transfer-progress < NUL"

timeout /t 3 /nobreak >nul

echo [3/4] Starting API Gateway (port 8080)...
start "API Gateway :8080" cmd /k "cd /d %ROOT%api-gateway && mvn spring-boot:run --no-transfer-progress < NUL"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend (port 5173)...
start "Frontend :5173" cmd /k "cd /d %ROOT%frontend-react && npm run dev"

echo.
echo  ============================================
echo   All services starting in background!
echo.
echo   Wait ~30 seconds then open:
echo   http://localhost:5173
echo  ============================================
echo.
pause
