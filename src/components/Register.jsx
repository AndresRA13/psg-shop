import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { firebaseError } = useAuth();

  const handleGoogleSignUp = async () => {
    setError('');
    setMessage('');
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
      console.error('Google sign-up error:', err);
      setError('Error al registrarse con Google. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error and message
    setError('');
    setMessage('');
    
    // Check if Firebase is properly configured
    if (firebaseError) {
      setError(firebaseError);
      return;
    }

    // Check if auth and db are available
    if (!auth || !db) {
      setError('Firebase no está configurado correctamente. Por favor, verifica tu archivo .env');
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Attempting to create user with email:", email);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user);
      
      // Store additional user info in Firestore
      console.log("Storing user info in Firestore...");
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: '',
        profileImage: '',
        createdAt: new Date(),
        role: 'customer' // Default role
      });
      console.log("User info stored successfully");
      
      // Show success message
      setMessage('Cuenta creada exitosamente. Redirigiendo...');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // More specific error handling
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este correo electrónico ya está registrado.');
          break;
        case 'auth/invalid-email':
          setError('El correo electrónico no es válido.');
          break;
        case 'auth/operation-not-allowed':
          setError('El registro de usuarios está deshabilitado. Por favor, habilita la autenticación en la consola de Firebase.');
          break;
        case 'auth/weak-password':
          setError('La contraseña es muy débil.');
          break;
        default:
          setError(`Error al crear la cuenta: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-white sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
            <svg className="w-6 h-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Register
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Create an account to get started!
          </p>
        </div>
        
        {/* Firebase Error Message */}
        {firebaseError && (
          <div className="relative px-4 py-3 text-yellow-700 bg-yellow-100 border border-yellow-400 rounded" role="alert">
            <strong className="font-bold">Configuración incompleta! </strong>
            <span className="block sm:inline">{firebaseError}</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Success Message */}
        {message && (
          <div className="relative px-4 py-3 text-green-700 bg-green-100 border border-green-400 rounded" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}
        
        {/* Google Sign Up Button */}
        <div>
          <button
            onClick={handleGoogleSignUp}
            disabled={loading || firebaseError}
            className="flex items-center justify-center w-full gap-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign up with Google</span>
          </button>
        </div>
        
        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">
              or Sign up with Email
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
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="mail@website.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={firebaseError || loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password*
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Min. 8 character"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={firebaseError || loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password*
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={firebaseError || loading}
                />
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading || firebaseError}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-full group hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
              Sign in
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

export default Register;