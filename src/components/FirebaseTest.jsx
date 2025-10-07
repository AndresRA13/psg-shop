import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { getAuth, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

const FirebaseTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');

  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('Testing Firebase configuration...');
        
        // Check if auth is initialized
        if (!auth) {
          throw new Error('Firebase Auth is not initialized');
        }
        
        // Check if db is initialized
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        
        // Try to get auth instance
        const authInstance = getAuth();
        console.log('Auth instance:', authInstance);
        
        setTestResult({
          authInitialized: !!auth,
          firestoreInitialized: !!db,
          projectId: authInstance?.app?.options?.projectId || 'Unknown',
          authTenantId: authInstance?.tenantId || 'None'
        });
      } catch (err) {
        console.error('Firebase test error:', err);
        setError(err.message);
      }
    };
    
    testFirebase();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message);
    }
  };

  const handleTestRegistration = async () => {
    try {
      console.log('Testing user registration with:', testEmail, testPassword);
      console.log('Using auth object:', auth);
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('Registration successful:', userCredential.user);
      alert('Registration test successful!');
      
      // Clean up test user
      try {
        await signOut(auth);
        console.log('Test user signed out');
      } catch (signOutErr) {
        console.warn('Could not sign out test user:', signOutErr);
      }
    } catch (err) {
      console.error('Registration test error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      let errorMessage = `${err.code} - ${err.message}`;
      
      if (err.code === 'auth/configuration-not-found') {
        errorMessage += '. This usually means Firebase Authentication is not enabled in your Firebase Console.';
      }
      
      setError(`Registration test failed: ${errorMessage}`);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Firebase Configuration Test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {testResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">Firebase Status</h3>
          <p><strong>Auth Initialized:</strong> {testResult.authInitialized ? 'Yes' : 'No'}</p>
          <p><strong>Firestore Initialized:</strong> {testResult.firestoreInitialized ? 'Yes' : 'No'}</p>
          <p><strong>Project ID:</strong> {testResult.projectId}</p>
          <p><strong>Tenant ID:</strong> {testResult.authTenantId}</p>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-2">Registration Test</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testEmail">
            Test Email
          </label>
          <input
            type="email"
            id="testEmail"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testPassword">
            Test Password
          </label>
          <input
            type="password"
            id="testPassword"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button 
          onClick={handleTestRegistration}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Test Registration
        </button>
        <button 
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign Out Test
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to <a href="https://console.firebase.google.com/project/psgshop-62518/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console Authentication</a></li>
          <li>Ensure "Email/Password" sign-in provider is enabled</li>
          <li>If not enabled, click the pencil icon to enable it</li>
          <li>Refresh this page after making changes</li>
        </ol>
      </div>
    </div>
  );
};

export default FirebaseTest;