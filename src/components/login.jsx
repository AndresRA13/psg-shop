import React, { useState } from 'react';
import { auth, GoogleAuthProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already exists in our database
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      // If user doesn't exist in our database, create a new document
      if (!userSnapshot.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          profileImage: user.photoURL || '',
          createdAt: new Date(),
          role: 'customer' // Default role
        });
        console.log("User info stored successfully for Google user");
      }
      
      navigate('/home');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No se encontró una cuenta con ese correo electrónico.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/invalid-email':
          setError('El correo electrónico no es válido.');
          break;
        case 'auth/user-disabled':
          setError('Esta cuenta ha sido deshabilitada.');
          break;
        default:
          setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            See your growth and get consulting support!
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Google Sign In Button */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
        
        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              or Sign in with Email
            </span>
          </div>
        </div>
        
        {/* Email/Password Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email*
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="mail@website.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password*
                </label>
                <div className="text-sm">
                  <Link to="/reset-password" className="font-medium text-purple-600 hover:text-purple-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Min. 8 character"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        {/* Registration Link */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Not registered yet?{' '}
            <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
              Create an Account
            </Link>
          </p>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            ©2020 Felix All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;