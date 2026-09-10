@echo off
setlocal
cd /d "%~dp0"

where pyw >nul 2>nul
if %errorlevel%==0 (
    start "" pyw -3 app.py
    exit /b 0
)

where pythonw >nul 2>nul
if %errorlevel%==0 (
    start "" pythonw app.py
    exit /b 0
)

if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\pythonw.exe" (
    start "" "%LOCALAPPDATA%\Python\pythoncore-3.14-64\pythonw.exe" app.py
    exit /b 0
)

echo Pythonが見つかりませんでした。
echo 操作説明書の「起動できない場合」を確認してください。
pause
