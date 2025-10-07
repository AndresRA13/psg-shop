import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

const DatabaseInit = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initializeDatabase = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Create sample categories
      const categories = [
        { name: 'Moños Elegantes', description: 'Moños para ocasiones formales' },
        { name: 'Moños Infantiles', description: 'Moños para niños y niñas' },
        { name: 'Moños Deportivos', description: 'Moños para actividades deportivas' },
        { name: 'Moños Casuales', description: 'Moños para uso diario' }
      ];
      
      // Create sample products
      const products = [
        {
          name: 'Moño Clásico Negro',
          description: 'Moño elegante de satén negro, perfecto para ocasiones formales',
          price: 25.99,
          category: 'Moños Elegantes',
          image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          stock: 50
        },
        {
          name: 'Moño Infantil Rojo',
          description: 'Moño color rojo vibrante para niños, cómodo y duradero',
          price: 15.99,
          category: 'Moños Infantiles',
          image: 'https://images.unsplash.com/photo-1614647615808-30460881f755?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          stock: 30
        },
        {
          name: 'Moño Deportivo Azul',
          description: 'Moño transpirable para actividades deportivas, color azul marino',
          price: 19.99,
          category: 'Moños Deportivos',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          stock: 40
        }
      ];
      
      // Initialize categories collection
      for (const category of categories) {
        await addDoc(collection(db, 'categories'), category);
      }
      
      // Initialize products collection
      for (const product of products) {
        await addDoc(collection(db, 'products'), product);
      }
      
      setMessage('Base de datos inicializada exitosamente con categorías y productos de ejemplo');
    } catch (err) {
      console.error('Error initializing database:', err);
      setError(`Error al inicializar la base de datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicializar Base de Datos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crea las colecciones iniciales para categorías y productos
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        
        <div>
          <button
            onClick={initializeDatabase}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Inicializando...' : 'Inicializar Base de Datos'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-bold mb-2">Instrucciones:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Asegúrate de que Firestore Database esté creado en tu proyecto Firebase</li>
            <li>Actualiza las reglas de seguridad de Firestore como se indicó anteriormente</li>
            <li>Haz clic en "Inicializar Base de Datos" para crear las colecciones de ejemplo</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DatabaseInit;