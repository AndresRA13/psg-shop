import React from 'react';
import TestStarRating from '../../components/TestStarRating';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Test Page</h1>
        <TestStarRating />
      </div>
    </div>
  );
};

export default TestPage;