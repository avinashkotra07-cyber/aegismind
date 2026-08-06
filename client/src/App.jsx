import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ThreatLogs from './pages/ThreatLogs';
import RemediationStudio from './pages/RemediationStudio';
import QuarantineManager from './pages/QuarantineManager';
import Settings from './pages/Settings';
import TrafficInterceptor from './pages/TrafficInterceptor';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-mono text-cyan-400 text-sm">
        🛡️ Verifying AegisMind Zero-Trust Authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected SOC Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interceptor"
            element={
              <ProtectedRoute>
                <TrafficInterceptor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/threats"
            element={
              <ProtectedRoute>
                <ThreatLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/remediation"
            element={
              <ProtectedRoute>
                <RemediationStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quarantine"
            element={
              <ProtectedRoute>
                <QuarantineManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
