import React from 'react';
import Navbar from '../../components/navbar';

const Home = () => {
  return (
     <>
       <Navbar />
     <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Bienvenido a BOWSHOP
          </h1>
          <p className="max-w-lg mx-auto mt-6 text-xl text-gray-500">
            La mejor tienda de moños en línea
          </p>
        </div>
      </div>
    </div>
  </>
  );
 
  
};

export default Home;