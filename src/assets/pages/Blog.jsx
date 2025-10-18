import React from 'react';
import { Link } from 'react-router-dom';
// Removed Navbar import since it's already rendered in App.jsx

const Blog = () => {
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Cómo elegir el moño perfecto para tu ocasión especial",
      excerpt: "Descubre los factores clave para seleccionar el moño ideal que complemente tu estilo y la ocasión.",
      date: "15 Oct 2025",
      author: "María González",
      category: "Guía de Estilo",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Tendencias de moda en moños para esta temporada",
      excerpt: "Explora las últimas tendencias en moños y cómo incorporarlas a tu guardarropa diario.",
      date: "10 Oct 2025",
      author: "Carlos Rodríguez",
      category: "Tendencias",
      image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Cuidado y mantenimiento de tus moños favoritos",
      excerpt: "Consejos profesionales para mantener tus moños en perfecto estado durante más tiempo.",
      date: "5 Oct 2025",
      author: "Ana Martínez",
      category: "Cuidado",
      image: "https://images.unsplash.com/photo-1595173425119-1c5134b706b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "La historia elegante de los moños en la moda",
      excerpt: "Un recorrido por la evolución de los moños desde sus orígenes hasta la actualidad.",
      date: "1 Oct 2025",
      author: "Sofía López",
      category: "Historia",
      image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 5,
      title: "Moños para eventos corporativos: Guía definitiva",
      excerpt: "Cómo seleccionar el moño adecuado para reuniones de negocios y eventos corporativos formales.",
      date: "25 Sep 2025",
      author: "Javier Pérez",
      category: "Eventos",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 6,
      title: "Personalización de moños: Hazlo único",
      excerpt: "Opciones creativas para personalizar tus moños y hacerlos verdaderamente únicos.",
      date: "20 Sep 2025",
      author: "Laura Torres",
      category: "Personalización",
      image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 7,
      title: "Los secretos de un moño perfecto: Técnicas profesionales",
      excerpt: "Aprende las técnicas utilizadas por expertos para crear moños impecables.",
      date: "15 Sep 2025",
      author: "Miguel Ángel",
      category: "Técnicas",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 8,
      title: "Moños sostenibles: Moda responsable",
      excerpt: "Descubre cómo la industria está adoptando prácticas ecológicas en la fabricación de accesorios.",
      date: "10 Sep 2025",
      author: "Valentina Ruiz",
      category: "Sostenibilidad",
      image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    }
  ];

  // Categories for filtering
  const categories = [
    "Todos",
    "Guía de Estilo",
    "Tendencias",
    "Cuidado",
    "Historia",
    "Eventos",
    "Personalización",
    "Técnicas",
    "Sostenibilidad"
  ];

  // Featured posts
  const featuredPosts = blogPosts.slice(0, 3);

  // Popular tags
  const tags = [
    "Moda", "Elegancia", "Accesorios", "Tendencias", 
    "Cuidado", "Eventos", "Personalización", "Historia",
    "Técnicas", "Sostenibilidad"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-700 to-purple-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog de PSG SHOP</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Descubre consejos, tendencias y guías sobre el mundo de los moños elegantes
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-all duration-300 cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">75+</div>
              <div className="text-gray-600">Artículos Publicados</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">30K+</div>
              <div className="text-gray-600">Lectores Mensuales</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">18</div>
              <div className="text-gray-600">Categorías</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">100%</div>
              <div className="text-gray-600">Contenido Original</div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Featured Posts */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Artículos Destacados</h2>
              <div className="grid md:grid-cols-1 gap-8">
                {featuredPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="md:flex">
                      <div className="md:w-2/5 h-64 md:h-auto">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/600x400.png?text=Imagen+Blog';
                          }}
                        />
                      </div>
                      <div className="p-8 md:w-3/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {post.category}
                          </span>
                          <span className="text-sm text-gray-500">{post.date}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h3>
                        <p className="text-gray-600 mb-6">{post.excerpt}</p>
                        <Link 
                          to={`/blog/${post.id}`} 
                          className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-300"
                        >
                          Leer más
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Posts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Últimos Artículos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200.png?text=Imagen+Blog';
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500">{post.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Por {post.author}</span>
                        <Link 
                          to={`/blog/${post.id}`} 
                          className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-300"
                        >
                          Leer más →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              <div className="text-center mt-10">
                <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Cargar Más Artículos
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Categorías</h3>
              <ul className="space-y-3">
                {categories.map((category, index) => (
                  <li key={index}>
                    <Link 
                      to="#" 
                      className={`block py-3 px-4 rounded-lg transition-colors duration-300 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 text-indigo-800 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category}</span>
                        <span className="text-gray-400 text-sm">({Math.floor(Math.random() * 15) + 1})</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Posts */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Más Populares</h3>
              <div className="space-y-6">
                {blogPosts.slice(0, 4).map((post, index) => (
                  <div key={post.id} className="flex group">
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x100.png?text=Blog';
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 text-lg">
                        <Link to={`/blog/${post.id}`}>{post.title}</Link>
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{post.date}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Boletín Informativo</h3>
              <p className="mb-4 opacity-90">
                Suscríbete para recibir las últimas novedades y artículos del blog
              </p>
              <form className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico" 
                  className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button 
                  type="submit" 
                  className="w-full bg-white text-indigo-700 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-md"
                >
                  Suscribirse
                </button>
              </form>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Acerca de PSG SHOP</h3>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  PS
                </div>
                <div className="ml-4">
                  <p className="font-bold text-gray-900">PSG SHOP</p>
                  <p className="text-sm text-gray-500">Tienda especializada en moños</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Tu destino para moños elegantes y accesorios de moda de alta calidad. 
                Descubre nuestra colección cuidadosamente seleccionada.
              </p>
              <Link 
                to="/shop" 
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Explorar Colección
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;