import React from 'react';
import { useUser } from '@clerk/clerk-react';

const DebugInfo = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h2 className="text-lg font-bold mb-2">Debug Information</h2>
      <p><strong>isLoaded:</strong> {isLoaded ? 'true' : 'false'}</p>
      <p><strong>isSignedIn:</strong> {isSignedIn ? 'true' : 'false'}</p>
      <p><strong>User:</strong> {user ? JSON.stringify(user) : 'null'}</p>
      {user && (
        <div>
          <p><strong>Public Metadata:</strong> {JSON.stringify(user.publicMetadata)}</p>
          <p><strong>Is Admin:</strong> {user.publicMetadata?.role === 'admin' ? 'true' : 'false'}</p>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;