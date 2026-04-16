import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { appointmentService } from '../services/appointmentService.jsx';
import { doctorService } from '../services/doctorService.jsx';
import { paymentService } from '../services/paymentService.jsx';
import { prescriptionService } from '../services/prescriptionService.jsx';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge.jsx';
import MandatoryRatingModal from '../components/MandatoryRatingModal.jsx';
import { canJoinAppointment, getJoinStatusText } from '../utils/time.js';
import { downloadPaymentReceiptPdf, downloadPrescriptionPdf } from '../utils/documentPdf.js';

const PatientDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [documentLoading, setDocumentLoading] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await appointmentService.getMyAppointments();
        setAppointments(response.data || []);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();

    const fetchPendingRatings = async () => {
      try {
        const response = await doctorService.getPendingRatings();
        setPendingRatings(response.data || []);
      } catch (error) {
        console.error('Error fetching pending ratings in dashboard:', error);
      }
    };

    fetchPendingRatings();
  }, []);

  const handleJoinMeet = async (appointment) => {
    try {
      const joinLinkResponse = await appointmentService.getJoinLink(appointment._id);
      const meetingLink = joinLinkResponse.data?.meetingLink;
      const response = await appointmentService.joinAppointment(appointment._id);
      const updated = response.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === appointment._id ? updated : appt)));
      if (meetingLink) {
        window.open(meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error joining meeting from dashboard:', error);
      alert(error.response?.data?.message || 'Unable to join meeting');
    }
  };

  const handleEndConsultation = async (appointmentId) => {
    try {
      const response = await appointmentService.completeAppointment(appointmentId);
      const updated = response.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === appointmentId ? updated : appt)));

      const pendingResponse = await doctorService.getPendingRatings();
      setPendingRatings(pendingResponse.data || []);
    } catch (error) {
      console.error('Error ending consultation from dashboard:', error);
      alert(error.response?.data?.message || 'Unable to complete consultation');
    }
  };

  const handleRatingSubmitted = (appointmentId) => {
    setPendingRatings((prev) => prev.filter((appt) => String(appt._id) !== String(appointmentId)));
  };

  const handleDownloadPrescription = async (appointment) => {
    const loadingKey = `prescription-${appointment._id}`;
    setDocumentLoading(loadingKey);

    try {
      const response = await prescriptionService.getPrescriptionByAppointment(appointment._id);
      const prescription = response?.data;

      downloadPrescriptionPdf({
        prescription,
        appointment,
        patientName: user?.name,
        doctorName: appointment?.doctorId?.name,
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to generate prescription PDF');
    } finally {
      setDocumentLoading('');
    }
  };

  const handleDownloadPayment = async (appointment) => {
    const loadingKey = `payment-${appointment._id}`;
    setDocumentLoading(loadingKey);

    try {
      const response = await paymentService.getPaymentDetails(appointment._id);
      const payment = response?.data;

      downloadPaymentReceiptPdf({
        payment,
        appointment,
        patientName: user?.name,
        doctorName: appointment?.doctorId?.name,
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to generate payment receipt PDF');
    } finally {
      setDocumentLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {pendingRatings.length > 0 && (
        <MandatoryRatingModal
          appointment={pendingRatings[0]}
          onSubmitted={handleRatingSubmitted}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Search and consult with verified healthcare professionals</p>
        </div>

        {/* Welcome Card */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 mb-8 shadow-sm">
          <p className="text-2xl font-semibold">Welcome back, {user?.name}!</p>
          <p className="text-orange-100 mt-2">Ready to consult with a healthcare professional</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Available Doctors</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                👨‍⚕️
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-sm text-gray-600">Verified healthcare professionals</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">My Consultations</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                💬
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-sm text-gray-600">Active conversations</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Appointments</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                📅
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-sm text-gray-600">Scheduled appointments</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Get Help Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/patient-home')}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Find a Doctor
            </button>
            <button
              onClick={() => navigate('/patient-appointments')}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Appointments
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Open Messages
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">My Appointments</h2>

          {loadingAppointments ? (
            <p className="text-gray-600">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="text-gray-600">No appointments booked yet.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 6).map((appointment) => (
                <div
                  key={appointment._id}
                  className="p-4 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Doctor: {appointment.doctorId?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentStatusBadge status={appointment.status} />
                    {canJoinAppointment(appointment) && (
                      <button
                        onClick={() => handleJoinMeet(appointment)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Join Meet
                      </button>
                    )}
                    {appointment.status === 'confirmed' && getJoinStatusText(appointment) && (
                      <span className="text-xs text-gray-600">{getJoinStatusText(appointment)}</span>
                    )}
                    {appointment.status === 'confirmed' && appointment.hasJoined && (
                      <button
                        onClick={() => handleEndConsultation(appointment._id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        End Consultation
                      </button>
                    )}
                    {appointment.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPrescription(appointment)}
                          disabled={documentLoading === `prescription-${appointment._id}`}
                          className="px-3 py-1.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                          Prescription PDF
                        </button>
                        <button
                          onClick={() => handleDownloadPayment(appointment)}
                          disabled={documentLoading === `payment-${appointment._id}`}
                          className="px-3 py-1.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                          Payment PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
