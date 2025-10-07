# BowShop - E-commerce de Moños

Una aplicación de comercio electrónico completa para la venta de moños, construida con React, Firebase y Tailwind CSS.

## Características

- **Autenticación de usuarios** con Firebase Authentication
- **Gestión de productos** con Firestore
- **Carrito de compras** con contexto de React
- **Panel de administración** para gestionar productos
- **Sistema de cupones** para descuentos
- **Sistema de reseñas** para productos
- **Diseño responsive** con Tailwind CSS
- **Rutas protegidas** para usuarios autenticados
- **Control de acceso basado en roles** (admin/customer)

## Tecnologías Utilizadas

- React 19
- Firebase (Authentication & Firestore)
- Tailwind CSS
- React Router DOM
- React Icons

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   ```

2. Navega al directorio del proyecto:
   ```bash
   cd cartshop
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

4. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración de Firebase:
   ```
   VITE_API_KEY=tu-api-key
   VITE_AUTH_DOMAIN=tu-auth-domain
   VITE_PROJECT_ID=tu-project-id
   VITE_STORAGE_BUCKET=tu-storage-bucket
   VITE_MESSAGING_SENDER_ID=tu-messaging-sender-id
   VITE_APP_ID=tu-app-id
   ```

## Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Activa Authentication con proveedor de email/password
3. Crea una base de datos Firestore
4. Copia las credenciales de configuración a tu archivo `.env`

## Creación del Usuario Administrador

1. Inicia la aplicación:
   ```bash
   npm run dev
   ```

2. Navega a `/admin-setup`
3. Crea un usuario administrador con email y contraseña
4. Inicia sesión con las credenciales del administrador
5. Accede al panel administrativo en `/admin`

## Estructura del Proyecto

```
src/
  components/          # Componentes reutilizables
  context/             # Contextos de React (CartContext)
  services/            # Servicios para interactuar con Firebase
  assets/
    pages/             # Páginas de la aplicación
    routes/            # Configuración de rutas
  firebase.js          # Configuración de Firebase
  App.jsx              # Componente principal de la aplicación
  main.jsx             # Punto de entrada de la aplicación
```

## Funcionalidades

### Para Clientes
- Registro e inicio de sesión
- Navegación por productos
- Vista detallada de productos
- Carrito de compras con cupones de descuento
- Sistema de reseñas de productos
- Lista de deseos (pendiente de implementación)

### Para Administradores
- Panel de administración protegido
- Gestión de productos (CRUD)
- Gestión de cupones de descuento (CRUD)
- Gestión de reseñas de productos (CRUD)
- Visualización de estadísticas
- Gestión de pedidos (pendiente de implementación)
- Gestión de usuarios (pendiente de implementación)

## Sistema de Reseñas

Los clientes pueden dejar reseñas para los productos que han comprado:

1. Después de realizar una compra, los clientes pueden dejar reseñas desde:
   - La página de detalles del producto
   - La sección "Mis Pedidos" donde pueden reseñar cada producto comprado
2. Las reseñas incluyen:
   - Calificación de 1 a 5 estrellas
   - Comentario descriptivo
3. Las reseñas son visibles públicamente en la página de detalles del producto

**Nota sobre índices de Firestore**: Para un mejor rendimiento, se recomienda crear índices compuestos en Firestore. Consulta el archivo `CREATE_INDEXES.md` para obtener instrucciones detalladas.

## Sistema de Cupones

Los administradores pueden crear y gestionar cupones de descuento desde el panel administrativo:

1. Accede al panel administrativo en `/admin`
2. Haz clic en el botón "Cupones"
3. Crea nuevos cupones especificando:
   - Código del cupón
   - Tipo de descuento (porcentaje o monto fijo)
   - Valor del descuento
   - Fecha de expiración (opcional)
   - Estado activo/inactivo

Los clientes pueden aplicar cupones en la página del carrito de compras ingresando el código del cupón.

## Desarrollo

### Iniciar el servidor de desarrollo
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

### Vista previa de la construcción
```bash
npm run preview
```

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.

## Contacto

Para cualquier pregunta o sugerencia, por favor abre un issue en el repositorio.