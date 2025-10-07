import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from "firebase/firestore";

const DatabaseTest = () => {
    const [testResult, setTestResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testRead = async () => {
        setLoading(true);
        try {
            const productsCollectionRef = collection(db, "products");
            const data = await getDocs(productsCollectionRef);
            setTestResult(`Lectura exitosa. Se encontraron ${data.docs.length} documentos.`);
        } catch (err) {
            setTestResult(`Error en lectura: ${err.message} (${err.code})`);
        }
        setLoading(false);
    };

    const testWrite = async () => {
        setLoading(true);
        try {
            const productsCollectionRef = collection(db, "products");
            await addDoc(productsCollectionRef, { 
                name: 'Test Product',
                description: 'Test product for database connection',
                price: 9.99,
                imageUrl: ''
            });
            setTestResult('Escritura exitosa.');
        } catch (err) {
            setTestResult(`Error en escritura: ${err.message} (${err.code})`);
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Prueba de Conexión a Base de Datos</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="mb-4">Resultado: {testResult}</p>
                <div className="space-x-4">
                    <button 
                        onClick={testRead}
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Probando...' : 'Probar Lectura'}
                    </button>
                    <button 
                        onClick={testWrite}
                        disabled={loading}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Probando...' : 'Probar Escritura'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseTest;