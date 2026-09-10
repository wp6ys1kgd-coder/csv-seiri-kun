@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 -m unittest discover -s tests -v
    pause
    exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
    python -m unittest discover -s tests -v
    pause
    exit /b %errorlevel%
)

if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" (
    "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" -m unittest discover -s tests -v
    pause
    exit /b %errorlevel%
)

echo Pythonが見つかりませんでした。
pause
