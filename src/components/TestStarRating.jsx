import React from 'react';
import StarRating from './StarRating';

const TestStarRating = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Star Rating Component</h2>
      <div className="space-y-4">
        <div>
          <p>5 stars:</p>
          <StarRating rating={5} size="md" />
        </div>
        <div>
          <p>3.5 stars:</p>
          <StarRating rating={3.5} size="md" />
        </div>
        <div>
          <p>0 stars:</p>
          <StarRating rating={0} size="md" />
        </div>
        <div>
          <p>Invalid rating:</p>
          <StarRating rating="invalid" size="md" />
        </div>
      </div>
    </div>
  );
};

export default TestStarRating;