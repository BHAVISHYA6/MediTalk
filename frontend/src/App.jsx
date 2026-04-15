import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from './services/axios.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Home from './pages/Home.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PendingDoctorsVerification from './pages/PendingDoctorsVerification.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import PatientHome from './pages/PatientHome.jsx';
import DoctorProfile from './pages/DoctorProfile.jsx';
import ChatPage from './pages/ChatPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage.jsx';
import PatientAppointmentsPage from './pages/PatientAppointmentsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import { getDefaultRouteForRole } from './utils/navigation.js';

const RootRoute = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated && user?.role) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Home />;
};

// Protected Route Component
const ProtectedRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requiredRole === 'doctor' && isAuthenticated && user?.role === 'doctor') {
      // Fetch fresh verification status from backend
      fetchVerificationStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role, requiredRole]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      console.log('📢 Verification response:', response.data);
      setVerificationStatus(response.data.data.verificationStatus);
      console.log('✅ Verification status set to:', response.data.data.verificationStatus);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  // Check if doctor is verified for doctor-specific routes
  if (requiredRole === 'doctor' && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (requiredRole === 'doctor' && verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your doctor account is currently under review by our admin team. 
            We will notify you once it has been approved.
          </p>
          <p className="text-sm text-gray-500">
            Status: <span className="font-semibold capitalize">{verificationStatus}</span>
          </p>
        </div>
      </div>
    );
  }

  return element;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
        />
        <Route
          path="/admin/verify-doctors"
          element={<ProtectedRoute element={<PendingDoctorsVerification />} requiredRole="admin" />}
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={<ProtectedRoute element={<DoctorDashboard />} requiredRole="doctor" />}
        />
        <Route
          path="/doctor-appointments"
          element={<ProtectedRoute element={<DoctorAppointmentsPage />} requiredRole="doctor" />}
        />

        {/* Patient Routes */}
        <Route
          path="/patient-home"
          element={<ProtectedRoute element={<PatientHome />} requiredRole="patient" />}
        />
        <Route
          path="/doctor/:id"
          element={<ProtectedRoute element={<DoctorProfile />} requiredRole="patient" />}
        />
        <Route
          path="/messages"
          element={<ProtectedRoute element={<MessagesPage />} />}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute element={<NotificationsPage />} />}
        />
        <Route
          path="/chat/:userId"
          element={<ProtectedRoute element={<ChatPage />} />}
        />
        <Route
          path="/patient-dashboard"
          element={<ProtectedRoute element={<PatientDashboard />} requiredRole="patient" />}
        />
        <Route
          path="/patient-appointments"
          element={<ProtectedRoute element={<PatientAppointmentsPage />} requiredRole="patient" />}
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
