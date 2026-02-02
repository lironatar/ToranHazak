@echo off
echo Starting Toren Hazak App...

:: Start Backend
start "Backend Server" cmd /k "cd backend && npm start"

:: Wait a bit for backend
timeout /t 5 /nobreak

:: Start Frontend
start "Frontend Client" cmd /k "cd frontend && npm run dev"

echo App is running!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
