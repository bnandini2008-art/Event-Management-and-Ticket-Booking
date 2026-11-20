@echo off
echo ========================================================
echo       EVENTIX DEV MODE (Django Backend + Vite Frontend)
echo ========================================================
echo.
echo Launching Django API Backend on port 8000...
start "Eventix Django API" cmd /k "cd /d %~dp0backend && python manage.py runserver 8000"

echo Launching Vite React Frontend on port 5173...
start "Eventix Vite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo Frontend URL: http://localhost:5173
echo Backend API:  http://127.0.0.1:8000
echo.
