import React from 'react';
import { Link } from 'react-router-dom';

const Blog = () => {
  // Información de la empresa
  const companyInfo = {
    name: "PSG SHOP",
    tagline: "Elegancia en cada detalle",
    description: "Tu destino para moños elegantes y accesorios de moda de alta calidad.",
    mission: "Ofrecer productos de la más alta calidad con un servicio excepcional, ayudando a nuestros clientes a expresar su estilo único a través de accesorios elegantes.",
    vision: "Ser la marca líder en accesorios de moda en Latinoamérica, reconocida por nuestra calidad, innovación y compromiso con la sostenibilidad.",
    values: [
      "Calidad Premium: Cada moño es creado con materiales de la más alta calidad.",
      "Diseño Único: Cada pieza es única y cuidadosamente diseñada.",
      "Sostenibilidad: Comprometidos con prácticas ecológicas responsables.",
      "Atención Personalizada: Servicio al cliente excepcional en cada interacción.",
      "Innovación: Siempre a la vanguardia de las tendencias de moda."
    ]
  };

  // Equipo
  const team = [
    {
      id: 1,
      name: "María González",
      role: "Fundadora & Directora Creativa",
      bio: "Con más de 10 años de experiencia en moda y accesorios, María lidera nuestro equipo con visión artística y pasión por la excelencia.",
      image: "https://ui-avatars.com/api/?name=María+González&background=4f46e5&color=ffffff"
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      role: "Director de Operaciones",
      bio: "Experto en logística y atención al cliente, Carlos asegura que cada pedido sea procesado con eficiencia y cuidado.",
      image: "https://ui-avatars.com/api/?name=Carlos+Rodríguez&background=7c3aed&color=ffffff"
    },
    {
      id: 3,
      name: "Ana Martínez",
      role: "Diseñadora Principal",
      bio: "Artista del textil con un ojo meticuloso para el detalle, Ana crea cada diseño con inspiración y precisión.",
      image: "https://ui-avatars.com/api/?name=Ana+Martínez&background=ec4899&color=ffffff"
    }
  ];

  // Logros
  const achievements = [
    {
      id: 1,
      number: "500+",
      label: "Clientes Satisfechos"
    },
    {
      id: 2,
      number: "100+",
      label: "Diseños Únicos"
    },
    {
      id: 3,
      number: "5.0",
      label: "Calificación Promedio"
    },
    {
      id: 4,
      number: "24/7",
      label: "Soporte al Cliente"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative py-20 text-white bg-gradient-to-r from-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container relative z-10 px-4 mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Sobre Nosotros</h1>
          <p className="max-w-2xl mx-auto mb-8 text-xl">
            {companyInfo.description}
          </p>
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-24 h-24 bg-white rounded-full">
              <span className="text-3xl font-bold text-indigo-700">PS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-8 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="p-4 transition-all duration-300 hover:shadow-lg rounded-xl">
                <div className="text-3xl font-bold text-indigo-700">{achievement.number}</div>
                <div className="text-gray-600">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Content */}
      <div className="container px-4 py-12 mx-auto">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Our Story */}
            <div className="p-8 mb-8 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
              <h2 className="pb-2 mb-6 text-2xl font-bold text-gray-900 border-b border-gray-200">Nuestra Historia</h2>
              <p className="mb-6 text-gray-600">
                PSG SHOP nació de la pasión por la elegancia y el detalle. Fundada en 2015 por María González, 
                nuestra tienda comenzó como un pequeño taller artesanal en el corazón de Cajamarca, Tolima. 
                Con el tiempo, hemos crecido hasta convertirnos en un referente de calidad en accesorios de moda.
              </p>
              <p className="mb-6 text-gray-600">
                Cada moño que creamos es una obra de arte, elaborada con materiales premium y técnicas tradicionales 
                que han sido perfeccionadas a lo largo de generaciones. Nuestro compromiso es ayudarte a expresar 
                tu estilo único con accesorios que no solo complementan tu look, sino que también cuentan tu historia.
              </p>
              <div className="flex justify-center my-6">
                <img 
                  src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                  alt="Nuestro taller" 
                  className="h-auto max-w-full shadow-md rounded-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x400.png?text=Nuestro+Taller';
                  }}
                />
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid gap-8 mb-8 md:grid-cols-2">
              <div className="p-8 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
                <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                  <span className="w-3 h-3 mr-3 bg-indigo-600 rounded-full"></span>
                  Nuestra Misión
                </h3>
                <p className="text-gray-600">
                  {companyInfo.mission}
                </p>
              </div>
              <div className="p-8 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
                <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                  <span className="w-3 h-3 mr-3 bg-purple-600 rounded-full"></span>
                  Nuestra Visión
                </h3>
                <p className="text-gray-600">
                  {companyInfo.vision}
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="p-8 mb-8 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
              <h2 className="pb-2 mb-6 text-2xl font-bold text-gray-900 border-b border-gray-200">Nuestros Valores</h2>
              <ul className="space-y-4">
                {companyInfo.values.map((value, index) => (
                  <li key={index} className="flex items-start p-4 transition-colors duration-300 rounded-lg hover:bg-gray-50">
                    <span className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 mr-3 text-xs font-bold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                      {index + 1}
                    </span>
                    <span className="text-gray-600">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Our Team */}
            <div className="p-6 mb-8 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Nuestro Equipo</h3>
              <div className="space-y-6">
                {team.map((member) => (
                  <div key={member.id} className="flex group">
                    <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-full">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900 transition-colors duration-300 group-hover:text-indigo-700">{member.name}</h4>
                      <p className="mb-2 text-sm text-indigo-600">{member.role}</p>
                      <p className="text-sm text-gray-600">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="p-6 mb-8 text-white transition-shadow duration-300 shadow-md bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl hover:shadow-lg">
              <h3 className="mb-2 text-xl font-bold">¿Tienes preguntas?</h3>
              <p className="mb-4 opacity-90">
                Estamos aquí para ayudarte. Contáctanos y nuestro equipo te atenderá personalmente.
              </p>
              <Link 
                to="/contact" 
                className="inline-block px-4 py-2 font-medium text-indigo-700 transition-all duration-300 bg-white rounded-lg shadow-md hover:bg-gray-100"
              >
                Contáctanos
              </Link>
            </div>

            {/* Shop CTA */}
            <div className="p-6 transition-shadow duration-300 bg-white shadow-md rounded-xl hover:shadow-lg">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Descubre Nuestra Colección</h3>
              <p className="mb-4 text-gray-600">
                Explora nuestra exclusiva colección de moños artesanales, diseñados para cada ocasión especial.
              </p>
              <Link 
                to="/shop" 
                className="inline-block px-4 py-2 text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:shadow-lg"
              >
                Ver Productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;