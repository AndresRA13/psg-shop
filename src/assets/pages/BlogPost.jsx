import React from 'react';
import { Link, useParams } from 'react-router-dom';
// Removed Navbar import since it's already rendered in App.jsx

const BlogPost = () => {
  // In a real app, this would come from a database or API
  const { id } = useParams();
  
  // Sample blog post data
  const blogPosts = [
    {
      id: 1,
      title: "Cómo elegir el moño perfecto para tu ocasión especial",
      date: "15 Oct 2025",
      author: "María González",
      category: "Guía de Estilo",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      content: `
        <p>Seleccionar el moño perfecto para una ocasión especial puede ser un desafío, pero con los consejos adecuados, puedes encontrar el accesorio ideal que complemente tu estilo y la naturaleza del evento.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Considera la ocasión</h2>
        <p>El tipo de evento es el primer factor a considerar. Un moño para una boda requiere un enfoque diferente que uno para una cena casual. Los eventos formales suelen llamar a diseños más elaborados y materiales de mayor calidad.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Combina con tu atuendo</h2>
        <p>El color y el estilo de tu ropa deben ser el punto de partida. Un moño debe complementar, no competir con tu outfit. Si llevas un vestido con estampado, opta por un moño en tonos neutros. Para atuendos sólidos, puedes experimentar con colores vibrantes o texturas interesantes.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Considera la temporada</h2>
        <p>Los materiales y colores apropiados varían según la época del año. En verano, los moños de seda liviana y colores claros son ideales. En invierno, puedes optar por tejidos más gruesos como el terciopelo o el brocado en tonos más oscuros.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Conoce tu rostro</h2>
        <p>La forma de tu rostro puede influir en el estilo de moño que mejor te queda. Los moños más anchos tienden a favorecer los rostros más estrechos, mientras que los diseños más delgados pueden equilibrar los rostros más anchos.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Calidad sobre cantidad</h2>
        <p>Invierte en un moño de calidad que se mantenga bien con el tiempo. Los materiales premium no solo se ven mejor, sino que también duran más. En PSG SHOP, nos especializamos en moños hechos con materiales de primera calidad que mantienen su forma y color después de múltiples usos.</p>
        
        <p className="mt-8">Con estos consejos, estarás lista para elegir el moño perfecto para cualquier ocasión especial. Recuerda que el mejor accesorio es aquel que te hace sentir segura y elegante.</p>
      `
    },
    {
      id: 2,
      title: "Tendencias de moda en moños para esta temporada",
      date: "10 Oct 2025",
      author: "Carlos Rodríguez",
      category: "Tendencias",
      image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      content: `
        <p>La moda de los moños continúa evolucionando, y esta temporada trae consigo emocionantes novedades que están revolucionando el mundo de los accesorios. Desde colores vibrantes hasta texturas innovadoras, descubre las tendencias que dominarán tu guardarropa.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">1. Colores Bold y Saturados</h2>
        <p>Esta temporada, los colores intensos están en todas partes. Desde el magenta profundo hasta el turquesa eléctrico, los moños en tonos vibrantes son la forma perfecta de agregar un toque de personalidad a cualquier atuendo. Estos colores no solo llaman la atención, sino que también transmiten confianza y estilo.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">2. Texturas Mixtas</h2>
        <p>La combinación de diferentes texturas en un solo moño es una tendencia que está ganando popularidad. Piensa en moños que combinan seda con encaje, o terciopelo con detalles metálicos. Esta mezcla de texturas agrega profundidad visual y crea piezas verdaderamente únicas.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">3. Moños Extra Anchos</h2>
        <p>El tamaño importa, y esta temporada los moños extra anchos son los protagonistas. Estos moños hacen una declaración audaz y pueden convertirse en el punto focal de cualquier outfit. Son especialmente populares para looks de oficina y eventos formales.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">4. Estampados Abstractos</h2>
        <p>Los patrones abstractos están reemplazando a los estampados florales tradicionales. Diseños geométricos, formas orgánicas y patrones artísticos están apareciendo en moños de alta gama. Estos estampados agregan interés visual sin abrumar el resto del atuendo.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">5. Detalles Sostenibles</h2>
        <p>Con el creciente enfoque en la moda sostenible, los moños hechos de materiales ecológicos y mediante procesos éticos están ganando terreno. Desde sedas orgánicas hasta tintes naturales, los consumidores conscientes buscan opciones que reflejen sus valores.</p>
        
        <p className="mt-8">En PSG SHOP, estamos al tanto de estas tendencias y ofrecemos una cuidadosa selección de moños que combinan estilo contemporáneo con calidad excepcional. Nuestra colección de esta temporada incorpora muchos de estos elementos para que puedas lucir a la moda sin sacrificar la elegancia clásica.</p>
      `
    }
  ];

  // Find the current post or use the first one as default
  const post = blogPosts.find(post => post.id.toString() === id) || blogPosts[0];

  // Related posts (excluding the current one)
  const relatedPosts = blogPosts.filter(p => p.id.toString() !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white py-4">
        <div className="container mx-auto px-4">
          <nav className="text-sm">
            <Link to="/home" className="text-indigo-600 hover:text-indigo-800">Inicio</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link to="/blog" className="text-indigo-600 hover:text-indigo-800">Sobre Nosotros</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-500">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Blog Post Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <article className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-96 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x600.png?text=Imagen+Blog';
                  }}
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {post.category}
                  </span>
                  <span className="text-gray-500">{post.date}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
                
                <div className="flex items-center mb-8 pb-6 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold mr-3">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{post.author}</p>
                    <p className="text-sm text-gray-500">Autor en PSG SHOP</p>
                  </div>
                </div>
                
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Link 
                      to="/blog" 
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      ← Volver a Sobre Nosotros
                    </Link>
                    <div className="flex space-x-4">
                      <a href="#" className="text-gray-500 hover:text-indigo-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-500 hover:text-indigo-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-500 hover:text-indigo-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Related Posts */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Artículos Relacionados</h3>
              <div className="space-y-4">
                {relatedPosts.map(post => (
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
                      <span className="text-xs text-indigo-600 font-medium">{post.category}</span>
                      <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mt-1">
                        <Link to={`/blog/${post.id}`}>{post.title}</Link>
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{post.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Categorías</h3>
              <ul className="space-y-2">
                {['Guía de Estilo', 'Tendencias', 'Cuidado', 'Historia', 'Eventos', 'Personalización'].map((category, index) => (
                  <li key={index}>
                    <Link 
                      to="#" 
                      className="block py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-300"
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
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
                  className="w-full px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button 
                  type="submit" 
                  className="w-full bg-white text-indigo-700 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  Suscribirse
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;