import React from 'react';
import TestStarRating from '../../components/TestStarRating';

const TestPage = () => {
  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl px-4 mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">Test Page</h1>
        <TestStarRating />
      </div>
    </div>
  );
};

export default TestPage;