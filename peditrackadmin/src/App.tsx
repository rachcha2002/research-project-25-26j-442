import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import PostRecommendations from './components/PostRecommendations';
import DoctorDashboard from './components/DoctorDashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import ProfileCompletion from './components/auth/ProfileCompletion';
import GoogleCallback from './components/auth/GoogleCallBack';

function AppRoutes() {
  const { doctor, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          doctor ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          doctor ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={logout}>
              <div className="p-8">
                <h1>Welcome to Peditrack Dashboard</h1>
              </div>
            </Dashboard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={logout}>
              <PostRecommendations />
            </Dashboard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultation"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={logout}>
              <DoctorDashboard />
            </Dashboard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <ProfileCompletion />
          </ProtectedRoute>
        }
      />
      <Route path="/google/callback" element={<GoogleCallback />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}