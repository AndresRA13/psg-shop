import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../App';

const AdminRoute = ({ children }) => {
    const { currentUser, isAdmin, loading, firebaseError } = useAuth();

    if (loading) {
        // Muestra un loader mientras se carga la información del usuario
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

    if (!currentUser) {
        // Si no ha iniciado sesión, redirige a la página de login
        return <Navigate to="/login" />;
    }

    if (!isAdmin) {
        // Si ha iniciado sesión pero no es admin, redirige a la home
        return <Navigate to="/home" />;
    }

    // Si es admin, muestra el contenido de la ruta protegida
    return children ? children : <Outlet />;
};

export default AdminRoute;