import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Tienda de Moños</h3>
            <p className="text-gray-300">
              La mejor selección de moños para todas las ocasiones.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="/home" className="text-gray-300 hover:text-white">Inicio</a></li>
              <li><a href="/cart" className="text-gray-300 hover:text-white">Carrito</a></li>
              <li><a href="/login" className="text-gray-300 hover:text-white">Iniciar Sesión</a></li>
              <li><a href="/register" className="text-gray-300 hover:text-white">Registrarse</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <address className="text-gray-300 not-italic">
              <p>Email: psgmoños@gmail.com</p>
              <p>Teléfono: (123) 456-7890</p>
            </address>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Tienda de Moños. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;