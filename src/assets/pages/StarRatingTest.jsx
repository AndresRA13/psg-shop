import React from 'react';
import StarRating from '../../components/StarRating';

const StarRatingTest = () => {
  const testRatings = [0, 0.5, 1, 1.3, 1.6, 2, 2.5, 3, 3.4, 3.6, 4, 4.2, 4.5, 4.8, 5];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Star Rating Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Different Rating Values</h2>
        
        <div className="space-y-4">
          {testRatings.map((rating, index) => (
            <div key={index} className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-medium">Rating: {rating}</span>
              <div className="flex items-center space-x-4">
                <StarRating rating={rating} size="sm" />
                <StarRating rating={rating} size="md" />
                <StarRating rating={rating} size="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarRatingTest;