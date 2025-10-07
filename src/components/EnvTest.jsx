import React from 'react';

const EnvTest = () => {
  // Log all environment variables for debugging
  console.log('All env variables:', import.meta.env);
  
  return (
    <div className="p-8 bg-yellow-100">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <p><strong>VITE_CLERK_PUBLISHABLE_KEY:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}</p>
      <p><strong>Key exists:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</p>
      <p><strong>Key length:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.length}</p>
      <p><strong>Key starts with pk_:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default EnvTest;