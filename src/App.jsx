// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './PrivateRoute';
import LoginForm from './Login';
import Main from './Main';
import Admin from './admin';
import RegistrationForm from './Register';
import Assignment from './Teacher';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegistrationForm />} />
          
          {/* Protected Routes */}
          <Route
            path="/main"
            element={
              <PrivateRoute>
                <Main />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute allowedRoles={['teacher']}>
                <Assignment />
              </PrivateRoute>
            }
          />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all unmatched routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
