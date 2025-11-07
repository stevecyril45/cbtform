@echo off
cd /d "%~dp0"
set COMMAND_FILE=generate.txt

if not exist "%COMMAND_FILE%" (
    echo Error: %COMMAND_FILE% not found in %~dp0!
    pause
    exit /b 1
)

for /f "usebackq delims=" %%i in ("%COMMAND_FILE%") do (
    echo Running OpenSSL command:
    echo %%i
    %%i
)

if %errorlevel% equ 0 (
    echo.
    echo Success! Cert files generated: localhost+ip.crt and localhost+ip.key
    dir localhost+ip.*
) else (
    echo.
    echo Failed with error code %errorlevel%. Check config file or OpenSSL.
)

pause