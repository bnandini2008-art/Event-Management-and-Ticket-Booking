@echo off
echo ========================================================
echo       EVENTIX - DREAM - BOOK - EXPERIENCE
echo       Compliant with IEEE 830 / ISO/IEC/IEEE 29148
echo ========================================================
echo.
echo Starting Eventix Full-Stack Application...
echo Access in your browser: http://127.0.0.1:8000
echo.

cd /d "%~dp0"
python backend\manage.py runserver 0.0.0.0:8000
pause
