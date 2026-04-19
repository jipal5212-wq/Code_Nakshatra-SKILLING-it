@echo off
echo Starting S-KILLING IT...

echo Starting Backend on port 5000...
start cmd /k "cd backend && npm start"

echo Starting Frontend Vite server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up!
echo The frontend will be available at http://localhost:5173
echo The backend will be available at http://localhost:5000
