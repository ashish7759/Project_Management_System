import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import IntroPage from './pages/IntroPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import DocumentManagement from './pages/DocumentManagement';
import DocumentVerify from './pages/DocumentVerify';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProgressTracker from './pages/ProgressTracker';
import ReportGeneration from './pages/ReportGeneration';
import AuditTrail from './pages/AuditTrail';
import Unauthorized from './pages/Unauthorized';
import IssueTracker from './pages/IssueTracker';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<IntroPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Application Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admin only */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/audit-log" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AuditTrail />
                </ProtectedRoute>
              } 
            />

            {/* Operator/Manager/Admin */}
            <Route 
              path="/documents/upload" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Operator']}>
                  <Navigate to="/documents?tab=upload" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents/:id/verify" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Operator']}>
                  <DocumentVerify />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/progress" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Operator']}>
                  <ProgressTracker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/issues" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Operator', 'Viewer']}>
                  <IssueTracker />
                </ProtectedRoute>
              } 
            />

            {/* Admin/Manager/Viewer */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Viewer']}>
                  <ReportGeneration />
                </ProtectedRoute>
              } 
            />

            {/* All Roles */}
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
