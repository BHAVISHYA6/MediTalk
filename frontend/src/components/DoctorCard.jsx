import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6">
      {/* Doctor Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
        <p className="text-sm text-orange-500 font-medium">{doctor.specialization}</p>
      </div>

      {/* Experience and Rating */}
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Experience:</span> {doctor.experience} years
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 text-sm">
            {renderStars(doctor.averageRating)}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {doctor.averageRating || 'No ratings'}
          </span>
          <span className="text-sm text-gray-600">({doctor.totalReviews})</span>
        </div>
      </div>

      {/* Standout Reason */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {doctor.standoutReason}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/doctor/${doctor._id}`)}
          className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => navigate(`/chat/${doctor._id}`)}
          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
        >
          💬 Chat
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
