@echo off
title ApexGrid — Stop All Services
color 0C

echo Stopping all ApexGrid services...

taskkill /FI "WINDOWTITLE eq User Service :8082*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Race Service :8081*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq API Gateway :8080*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend :5173*" /F >nul 2>&1

:: Kill by port as fallback
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 :8081 :8082 :5173" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo All services stopped.
pause
