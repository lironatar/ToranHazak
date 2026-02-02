import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DailyScheduler from './components/DailyScheduler';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import GuestDashboard from './components/GuestDashboard';

// Define the Protected Route Component *outside* of the main App component
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  // Initialize theme from localStorage or fallback to time-based
  // Initialize theme from localStorage or fallback to dark
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  // Effect to apply theme class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className="app-content">
        {/* Global Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'var(--glass-bg)',
            border: '1px solid var(--accent-color)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: '1.2rem'
          }}
          title="החלף ערכת נושא"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/scheduler" element={<DailyScheduler />} />
          <Route path="/dashboard" element={<GuestDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
