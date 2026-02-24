import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PostRecommendations from './components/PostRecommendations';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorVideoCall from './components/DoctorVideoCall';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout}>
                  <div className="p-8">
                    <h1>Welcome to Peditrack Dashboard</h1>
                  </div>
                </Dashboard>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/recommendations"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout}>
                  <PostRecommendations />
                </Dashboard>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/consultation"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout}>
                <DoctorDashboard />
                </Dashboard>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/consultation/call"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout}>
                  <DoctorVideoCall />
                </Dashboard>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;