import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doctorService } from '../services/doctorService.jsx';
import ReviewList from '../components/ReviewList.jsx';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchDoctorProfile();
  }, [id]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctorProfile(id);
      if (response.success) {
        setDoctor(response.data);
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Doctor Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{doctor.name}</h1>
              <p className="text-xl text-orange-500 font-medium mt-1">{doctor.specialization}</p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'patient' && (
                <button
                  onClick={() => navigate(`/chat/${doctor._id}`)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  💬 Chat
                </button>
              )}
              <button
                onClick={() => navigate('/patient-home')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                ← Back To Doctors
              </button>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Experience</p>
              <p className="text-xl font-bold text-gray-900">{doctor.experience} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-xl font-bold text-gray-900">{doctor.averageRating || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-xl font-bold text-gray-900">{doctor.totalReviews}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold text-green-600">Verified</p>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Why they stand out</h2>
            <p className="text-gray-700">{doctor.standoutReason}</p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
          </div>

          {/* Rating Summary */}
          {doctor.averageRating && doctor.totalReviews > 0 && (
            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{doctor.averageRating}</div>
                  <div className="text-yellow-400 text-lg">{renderStars(doctor.averageRating)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Based on {doctor.totalReviews} review{doctor.totalReviews !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {/* Certification */}
        {doctor.certificationFile && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Credentials</h2>
            <a
              href={`http://localhost:5000${doctor.certificationFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
            >
              📄 View Certification
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
