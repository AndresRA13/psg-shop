import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../App';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading, firebaseError } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>;
    }

    // Handle Firebase configuration errors
    if (firebaseError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Configuración incompleta! </strong>
                        <span className="block sm:inline">{firebaseError}</span>
                        <p className="mt-2 text-sm">
                            Por favor, verifica tu archivo .env con las credenciales de Firebase.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return currentUser ? (children ? children : <Outlet />) : <Navigate to="/login" />;
};

export default ProtectedRoute;