import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../services/axios.jsx';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/stats');

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform users and verify doctors</p>
        </div>

        {/* Welcome Card */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 mb-8 shadow-sm">
          <p className="text-2xl font-semibold">Welcome back, {user?.name}!</p>
          <p className="text-orange-100 mt-2">You have admin access to manage the platform</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Total Users</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                  👥
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>

            {/* Total Doctors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Total Doctors</h3>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                  👨‍⚕️
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
            </div>

            {/* Pending Doctors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Pending</h3>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-lg">
                  ⏳
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingDoctors}</p>
            </div>

            {/* Approved Doctors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Approved</h3>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                  ✓
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.approvedDoctors}</p>
            </div>

            {/* Total Patients */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Patients</h3>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-lg">
                  💊
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Verification Card */}
          <Link
            to="/admin/verify-doctors"
            className="bg-white rounded-lg border border-gray-200 p-8 hover:shadow-md transition-shadow hover:border-orange-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Doctor Verification
                </h3>
                <p className="text-gray-600 mt-2">
                  Review and approve pending doctor applications
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
            {stats && stats.pendingDoctors > 0 && (
              <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {stats.pendingDoctors} pending
              </div>
            )}
          </Link>

          {/* Verified Doctors Card */}
          <Link
            to="/admin/verify-doctors"
            className="bg-white rounded-lg border border-gray-200 p-8 hover:shadow-md transition-shadow hover:border-green-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  Review Doctors
                </h3>
                <p className="text-gray-600 mt-2">
                  Open verification queue and manage doctor approvals
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
            {stats && (
              <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {stats.approvedDoctors} approved
              </div>
            )}
          </Link>
        </div>

        {/* Activity Section */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <p className="text-gray-700">
                <span className="font-semibold">{stats?.totalUsers}</span> total
                registered users
              </p>
              <span className="text-gray-600 text-sm">All time</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <p className="text-gray-700">
                <span className="font-semibold">{stats?.pendingDoctors}</span> doctors
                awaiting verification
              </p>
              <span className="text-yellow-600 text-sm font-medium">Action needed</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <p className="text-gray-700">
                <span className="font-semibold">{stats?.approvedDoctors}</span> doctors
                approved
              </p>
              <span className="text-green-600 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
