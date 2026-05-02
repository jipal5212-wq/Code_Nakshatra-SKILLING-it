@echo off
title SKILLING IT Platform
echo ===================================================
echo     Starting the SKILLING IT Platform...
echo ===================================================
echo.
echo Launching server... Please wait...
echo.

:: Wait for a second to ensure the command prompt is ready
timeout /t 1 /nobreak >nul

:: Automatically open the default web browser to the platform
start http://localhost:3000

:: Run the Node.js server
node server.js

:: If the server crashes or is stopped, pause so the user can see the error
pause
