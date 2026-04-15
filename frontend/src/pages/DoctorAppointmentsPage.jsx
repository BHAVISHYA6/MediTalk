import { useEffect, useMemo, useState } from 'react';
import { appointmentService } from '../services/appointmentService.jsx';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge.jsx';
import { canJoinAppointment, getJoinStatusText, getMeetingJoinState } from '../utils/time.js';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getMyAppointments();
      setAppointments(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (filter === 'completed') return appt.status === 'completed';
      if (filter === 'cancelled') return appt.status === 'cancelled';
      return ['pending', 'confirmed'].includes(appt.status);
    });
  }, [appointments, filter]);

  const handleComplete = async (id) => {
    try {
      const response = await appointmentService.completeAppointment(id);
      const updated = response.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === id ? updated : appt)));
    } catch (err) {
      console.error('Error completing appointment:', err);
      alert(err.response?.data?.message || 'Unable to mark completed');
    }
  };

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
    } catch (err) {
      console.error('Error joining meeting:', err);
      alert(err.response?.data?.message || 'Unable to join meeting');
    }
  };

  const handleCancel = async (id) => {
    try {
      const response = await appointmentService.cancelAppointment(id);
      const updated = response.data;
      setAppointments((prev) => prev.map((appt) => (appt._id === id ? updated : appt)));
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(err.response?.data?.message || 'Unable to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-1">Manage consultation schedule and status</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-2 rounded-lg border ${filter === 'upcoming' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-2 rounded-lg border ${filter === 'completed' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-2 rounded-lg border ${filter === 'cancelled' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-600">
            No appointments found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appt) => (
              <div key={appt._id} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">Patient: {appt.patientId?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appt.startTime).toLocaleString()} - {new Date(appt.endTime).toLocaleTimeString()}
                    </p>
                    {appt.notes && <p className="text-sm text-gray-700 mt-1">Notes: {appt.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentStatusBadge status={appt.status} />
                    {canJoinAppointment(appt) && (
                      <button
                        onClick={() => handleJoinMeet(appt)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Join Meet
                      </button>
                    )}
                    {appt.status === 'confirmed' && getJoinStatusText(appt) && (
                      <span className="text-xs text-gray-600">{getJoinStatusText(appt)}</span>
                    )}
                    {appt.status === 'confirmed' && appt.hasJoined && (
                      <button
                        onClick={() => handleComplete(appt._id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        End Consultation
                      </button>
                    )}
                    {(appt.status === 'pending' || (appt.status === 'confirmed' && getMeetingJoinState(appt) !== 'expired')) && (
                      <button
                        onClick={() => handleCancel(appt._id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
