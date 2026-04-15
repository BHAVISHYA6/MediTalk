import React from 'react';

const ReviewList = ({ reviews }) => {
  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-gray-900">{review.patientId?.name || 'Anonymous'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400">{renderStars(review.rating)}</span>
                <span className="text-sm text-gray-600">{review.rating}/5</span>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
