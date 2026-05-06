@echo off
title SKILLING IT Platform
echo ===================================================
echo     Starting the SKILLING IT Platform...
echo ===================================================
echo.

:: Check for .env file
if not exist ".env" (
    echo  WARNING: No .env file found!
    echo  Copy .env.example to .env and fill in your Supabase keys.
    echo.
)

:: Start server in background
echo  Launching server...
start /B node server.js

:: Wait 3 seconds for server to be ready, then open browser
echo  Waiting for server to start...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo  Server is running at http://localhost:3000
echo  Press Ctrl+C to stop.
echo.

:: Keep window open and show server output
node server.js
pause
