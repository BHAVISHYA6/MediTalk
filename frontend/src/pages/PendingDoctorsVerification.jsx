import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios.jsx';

const PendingDoctorsVerification = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchPendingDoctors();
  }, [user, navigate]);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/doctors/pending');

      if (response.data.success) {
        setDoctors(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching pending doctors:', err);
      setError(err.response?.data?.message || 'Error fetching doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      setActionLoading(true);
      const response = await axiosInstance.patch(
        `/admin/doctors/${doctorId}/approve`,
        {}
      );

      if (response.data.success) {
        setDoctors(doctors.filter((d) => d._id !== doctorId));
        setSelectedDoctor(null);
        alert('Doctor approved successfully!');
      }
    } catch (err) {
      console.error('Error approving doctor:', err);
      alert(err.response?.data?.message || 'Error approving doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (doctorId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await axiosInstance.patch(
        `/admin/doctors/${doctorId}/reject`,
        { reason: rejectionReason }
      );

      if (response.data.success) {
        setDoctors(doctors.filter((d) => d._id !== doctorId));
        setSelectedDoctor(null);
        setRejectionReason('');
        alert('Doctor rejected successfully!');
      }
    } catch (err) {
      console.error('Error rejecting doctor:', err);
      alert(err.response?.data?.message || 'Error rejecting doctor');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading pending doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Doctor Verification</h1>
          <p className="text-gray-600 mt-2">Review and approve pending doctor applications</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {doctors.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No pending doctor applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctors List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">
                    Pending Applications ({doctors.length})
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor._id}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setRejectionReason('');
                      }}
                      className={`w-full text-left px-6 py-4 hover:bg-orange-50 transition-colors ${
                        selectedDoctor?._id === doctor._id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{doctor.name}</p>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor Details */}
            {selectedDoctor && (
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {selectedDoctor.name}
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-gray-900">{selectedDoctor.email}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Specialization</p>
                      <p className="text-gray-900">{selectedDoctor.specialization}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Experience</p>
                      <p className="text-gray-900">{selectedDoctor.experience} years</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Why They Stand Out</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {selectedDoctor.standoutReason}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Certification</p>
                      {selectedDoctor.certificationFile && (
                        <a
                          href={`http://localhost:5000${selectedDoctor.certificationFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 font-medium rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          📄 View Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

                  <div className="space-y-4">
                    {/* Approve Button */}
                    <button
                      onClick={() => handleApprove(selectedDoctor._id)}
                      disabled={actionLoading}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? 'Processing...' : '✓ Approve Doctor'}
                    </button>

                    {/* Reject Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection..."
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        onClick={() => handleReject(selectedDoctor._id)}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading ? 'Processing...' : '✗ Reject Doctor'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingDoctorsVerification;
