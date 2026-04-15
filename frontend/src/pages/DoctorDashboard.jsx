import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios.jsx';
import { appointmentService } from '../services/appointmentService.jsx';
import { canJoinAppointment, getJoinStatusText } from '../utils/time.js';

const DoctorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meResponse, appointmentsResponse] = await Promise.all([
          axiosInstance.get('/auth/me'),
          appointmentService.getMyAppointments(),
        ]);

        setVerificationStatus(meResponse.data?.data?.verificationStatus || 'pending');
        setAppointments(appointmentsResponse.data || []);
      } catch (error) {
        console.error('Error fetching doctor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeConsultations = useMemo(() => {
    return appointments.filter((appt) => ['pending', 'confirmed'].includes(appt.status)).length;
  }, [appointments]);

  const nextConfirmedAppointment = useMemo(() => {
    return appointments.find((appt) => appt.status === 'confirmed') || null;
  }, [appointments]);

  const handleJoinMeet = async (appointment) => {
    try {
      const joinLinkResponse = await appointmentService.getJoinLink(appointment._id);
      const meetingLink = joinLinkResponse.data?.meetingLink;
      const joinResponse = await appointmentService.joinAppointment(appointment._id);
      const updated = joinResponse.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === appointment._id ? updated : appt)));
      if (meetingLink) {
        window.open(meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error joining meeting from doctor dashboard:', error);
      alert(error.response?.data?.message || 'Unable to join meeting');
    }
  };

  const handleEndConsultation = async (appointmentId) => {
    try {
      const response = await appointmentService.completeAppointment(appointmentId);
      const updated = response.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === appointmentId ? updated : appt)));
    } catch (error) {
      console.error('Error ending consultation from doctor dashboard:', error);
      alert(error.response?.data?.message || 'Unable to complete consultation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete your profile and start consulting with patients</p>
        </div>

        {/* Welcome Card */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 mb-8 shadow-sm">
          <p className="text-2xl font-semibold">Welcome back, {user?.name}!</p>
          <p className="text-orange-100 mt-2">Your doctor profile is active and ready for consultations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Verification Status</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                ⏳
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2 capitalize">
              {verificationStatus === 'approved' ? 'Approved' : verificationStatus}
            </p>
            <p className="text-sm text-gray-600">Current verification stage</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Active Consultations</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                💬
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{activeConsultations}</p>
            <p className="text-sm text-gray-600">Pending and confirmed appointments</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Your Rating</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                ⭐
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">-</p>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Open Messages
            </button>
            <button
              onClick={() => navigate('/doctor-appointments')}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Appointments
            </button>
          </div>
        </div>

        {nextConfirmedAppointment && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Consultation</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  Patient: {nextConfirmedAppointment.patientId?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(nextConfirmedAppointment.startTime).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canJoinAppointment(nextConfirmedAppointment) && (
                  <button
                    onClick={() => handleJoinMeet(nextConfirmedAppointment)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Join Meet
                  </button>
                )}

                {nextConfirmedAppointment.status === 'confirmed' && getJoinStatusText(nextConfirmedAppointment) && (
                  <p className="text-xs text-gray-600">{getJoinStatusText(nextConfirmedAppointment)}</p>
                )}

                {nextConfirmedAppointment.hasJoined && (
                  <button
                    onClick={() => handleEndConsultation(nextConfirmedAppointment._id)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    End Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
