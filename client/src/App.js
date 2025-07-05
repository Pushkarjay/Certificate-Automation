import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { AdminRoute, PublicRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCertificate from './pages/VerifyCertificate';

// Protected Pages
import Dashboard from './pages/Dashboard';
import CertificateView from './pages/CertificateView';
import CertificateList from './pages/CertificateList';
import Profile from './pages/Profile';
import ClaimCertificate from './pages/ClaimCertificate';

// Admin Pages
import GenerateCertificate from './pages/GenerateCertificate';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/verify" element={<VerifyCertificate />} />
                <Route path="/verify/:dofNo" element={<VerifyCertificate />} />
                <Route path="/claim/:claimToken" element={<ClaimCertificate />} />
                
                {/* Auth Routes (redirect if already logged in) */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />

                {/* Protected User Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/certificates" element={
                  <ProtectedRoute>
                    <CertificateList />
                  </ProtectedRoute>
                } />
                <Route path="/certificate/:id" element={
                  <ProtectedRoute>
                    <CertificateView />
                  </ProtectedRoute>
                } />

                {/* Admin Only Routes */}
                <Route path="/generate" element={
                  <AdminRoute>
                    <GenerateCertificate />
                  </AdminRoute>
                } />
                <Route path="/generate-certificate" element={
                  <AdminRoute>
                    <GenerateCertificate />
                  </AdminRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                } />
                <Route path="/admin/organizations" element={
                  <AdminRoute>
                    <div className="text-center py-16">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Management</h1>
                      <p className="text-gray-600">Coming Soon</p>
                    </div>
                  </AdminRoute>
                } />
                <Route path="/admin/analytics" element={
                  <AdminRoute>
                    <div className="text-center py-16">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
                      <p className="text-gray-600">Coming Soon</p>
                    </div>
                  </AdminRoute>
                } />
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={
                  <div className="text-center py-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                } />
              </Routes>
            </main>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
