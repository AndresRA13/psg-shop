import React, { useState } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Link } from 'react-router-dom';
// Removed Navbar import since it's already rendered in App.jsx

const Contact = () => {
  // Formspree form setup
  const [state, handleSubmit] = useForm("mpwybkly");
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative py-20 text-white bg-gradient-to-r from-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container relative z-10 px-4 mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Contáctanos</h1>
          <p className="max-w-2xl mx-auto text-xl">
            ¿Tienes preguntas? Estamos aquí para ayudarte. Envíanos un mensaje y nos pondremos en contacto contigo pronto.
          </p>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto">
        {state.succeeded ? (
          <div className="max-w-4xl p-4 mx-auto mb-8 rounded-md bg-green-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Gracias por tu mensaje!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="p-8 bg-white shadow-md rounded-xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="tu@email.com"
                    />
                    <ValidationError 
                      prefix="Email" 
                      field="email"
                      errors={state.errors}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-700">
                    Asunto
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="¿Sobre qué te gustaría hablar?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-700">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                  <ValidationError 
                    prefix="Message" 
                    field="message"
                    errors={state.errors}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={state.submitting}
                    className={`w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${state.submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {state.submitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <div className="p-8 mb-8 bg-white shadow-md rounded-xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Información de Contacto</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-lg font-semibold text-gray-900">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Lun - Vie, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg font-semibold text-gray-900">info@psgshop.com</p>
                    <p className="text-sm text-gray-500">Respuesta en 24 horas hábiles</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Dirección</p>
                    <p className="text-lg font-semibold text-gray-900">Calle Principal 123</p>
                    <p className="text-sm text-gray-500">Cajamarca, Tolima, Colombia</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Map */}
            <div className="p-8 mb-8 bg-white shadow-md rounded-xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Nuestra Ubicación</h2>
              <div className="h-64 overflow-hidden rounded-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15782.9116518304!2d-75.31303365!3d4.48527395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38f5a5a5a5a5a5%3A0x5a5a5a5a5a5a5a5a!2sCajamarca%2C%20Tolima%2C%20Colombia!5e0!3m2!1sen!2sco!4v1678901234567!5m2!1sen!2sco" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de PSG SHOP en Cajamarca, Tolima, Colombia"
                ></iframe>
              </div>
            </div>
            
            {/* Business Hours */}
            <div className="p-8 mb-8 bg-white shadow-md rounded-xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Horario de Atención</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Lunes</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Martes</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Miércoles</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Jueves</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Viernes</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Sábado</span>
                  <span className="font-medium text-gray-900">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Domingo</span>
                  <span className="font-medium text-indigo-600">Cerrado</span>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="p-8 text-white shadow-md bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl">
              <h2 className="mb-4 text-2xl font-bold">Síguenos en redes</h2>
              <p className="mb-6 opacity-90">Mantente actualizado con nuestras últimas novedades y promociones</p>
              <div className="flex space-x-4">
                <a href="#" className="p-3 transition-all duration-300 bg-white rounded-full bg-opacity-20 hover:bg-opacity-30">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="p-3 transition-all duration-300 bg-white rounded-full bg-opacity-20 hover:bg-opacity-30">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a href="#" className="p-3 transition-all duration-300 bg-white rounded-full bg-opacity-20 hover:bg-opacity-30">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.689-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.689-.072 4.849-.072zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="p-8 mt-16 bg-white shadow-md rounded-xl">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Preguntas Frecuentes</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-5 transition-colors duration-300 border border-gray-200 rounded-lg hover:border-indigo-300">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">¿Cuánto tiempo tardan en responder?</h3>
              <p className="text-gray-600">Normalmente respondemos todos los correos electrónicos dentro de las 24 horas hábiles.</p>
            </div>
            <div className="p-5 transition-colors duration-300 border border-gray-200 rounded-lg hover:border-indigo-300">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">¿Ofrecen envío internacional?</h3>
              <p className="text-gray-600">Sí, enviamos a la mayoría de países. Los costos y tiempos de envío varían según la ubicación.</p>
            </div>
            <div className="p-5 transition-colors duration-300 border border-gray-200 rounded-lg hover:border-indigo-300">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">¿Puedo cambiar o devolver un producto?</h3>
              <p className="text-gray-600">Por supuesto. Ofrecemos devoluciones dentro de los 30 días posteriores a la compra.</p>
            </div>
            <div className="p-5 transition-colors duration-300 border border-gray-200 rounded-lg hover:border-indigo-300">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">¿Cómo puedo rastrear mi pedido?</h3>
              <p className="text-gray-600">Recibirás un correo electrónico con el número de seguimiento una vez que tu pedido haya sido enviado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;