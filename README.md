# Sistema de Gestión y Publicación de Horarios (PublicarHorarios)

## 📋 Descripción del Proyecto

**PublicarHorarios** es una aplicación web moderna diseñada para optimizar la gestión y distribución de horarios laborales en equipos de trabajo como "Grupo Superior". Su objetivo principal es reemplazar los métodos tradicionales y manuales (como el envío de PDFs por WhatsApp o impresiones físicas) por una plataforma digital centralizada, visualmente intuitiva, rápida y accesible.

El flujo de trabajo se centra en la eficiencia:
1.  **Administrador**: Crea y visualiza los horarios en una cuadrícula (grid) interactiva, gestiona a los usuarios del sistema, y cuenta con la capacidad vital de **subir planificaciones masivamente** a través de archivos **Excel**, ahorrando horas de trabajo manual.
2.  **Empleado**: Accede a la plataforma mediante credenciales seguras y visualiza claramente sus turnos y días libres en un formato de calendario semanal, eliminando confusiones.

> [!WARNING]
> IMPORTANTE (Deuda Técnica de Seguridad): Actualmente la aplicación funciona como un MVP (Producto Mínimo Viable) o prototipo que utiliza un archivo JSON local. **El sistema de autenticación depende del cliente (`localStorage`) y no implementa JWT, Cookies HttpOnly ni validaciones de firmas en el Backend (`middleware.js`)**. No despliegues esta versión con datos sensibles en producción sin antes modernizar la capa de seguridad.

## 🚀 Tecnologías Utilizadas

Este proyecto utiliza el siguiente stack para su desarrollo iterativo rápido:

### Frontend
-   **[Next.js 16 (App Router)](https://nextjs.org/)**: Framework de React que maneja el enrutamiento y la estructura base.
-   **[React 19](https://react.dev/)**: Librería para construir las interfaces de usuario interactivas (Componentes).
-   **[Tailwind CSS v4](https://tailwindcss.com/)**: Framework de rescate rápido para estilos y diseño responsivo.
-   **Librerías Visuales**: `lucide-react` para iconos y `framer-motion` para animaciones y modales.
-   **Manejo de Fechas**: `date-fns` para cálculo de periodos laborales e intervalos.

### Backend y Datos (MVP Local)
-   **Next.js API Routes (`/app/api/...`)**: Endpoints Node.js backend-for-frontend.
-   **Archivo Local JSON (`data.json`)**: Archivo auto-generado manipulado directamente vía librería nativa `fs` de Node, utilizado como base de datos en memoria para este prototipo.
-   **Parseo de Excel**: `xlsx` (SheetJS) ejecutado del lado del cliente para extraer información y pasarla a las API Routes.

## 🏗️ Arquitectura del Sistema

La arquitectura está basada en el patrón estándar de un monolito de Next.js (App Router):

1.  **Capa Gráfica (UI - Components)**: Localizada en `/components`. Contiene piezas reutilizables ricas en estado como `ShiftGrid` (cuadrícula principal interactiva), `UserManagement` (crud complejo), `BulkUpload` y modales de configuración.
2.  **Capa de Páginas (`/app`)**: Agrupa las vistas por rol de usuario:
    -   `/admin`: Dashboard principal con panel de pestañas.
    -   `/employee`: Vista de calendario orientada al trabajador.
    -   `/login`: Pantalla de autenticación combinada.
3.  **Capa Lógica del Negocio (`/lib`)**: Centraliza utilidades compartidas como el cálculo de los ciclos laborales de la empresa (`workPeriod.js`) y lecturas seguras de la base de JSON local (`db.js`).
4.  **Capa de API (`/api/*`)**: Contiene las rutas que manejan todas las mutaciones al archivo `.json` simulando un sistema RESTful tradicional (GET, POST, PUT, DELETE).

### Ciclo del Flujo de Datos (Carga Masiva)
`Excel File (.xlsx)` -> `Browser (FileReader + SheetJS)` -> `JSON Array (En memoria del cliente)` -> `POST /api/shifts/bulk` -> `Guardado en data.json`.

## 🔒 Plan de Seguridad Futuro (Producción)

Al pasar esta aplicación a producción real, la deuda técnica actual (**autenticación por localStorage y falta de middleware real**) debe resolverse:

1.  **Base de Datos Real**: Migrar `data.json` a PostgreSQL (ej. Supabase) o MongoDB.
2.  **Manejo de Sesiones**: Implementar **NextAuth.js (Auth.js)** o **Supabase Auth** para gestionar tokens JWT seguros firmados del lado del servidor.
3.  **Middleware Auténtico**: El archivo global `middleware.js` debe verificar las JWT Cookies entrantes antes de renderizar la página del Panel de Admin (`/admin`), previniendo accesos directos desde la URL.
4.  **Validación de Permisos en la API**: Las rutas bajo `/api/` deben decodificar el JWT y garantizar que el emisor de la petición (POST, DELETE) realmente sea un usuario con rol "admin".

## 🛠️ Instalación y Entorno Local

1.  **Clonar el repositorio y entrar**:
    ```bash
    git clone https://github.com/kelvinL55/PublicarHorarios.git
    cd PublicarHorarios
    ```

2.  **Instalar dependencias clave**:
    ```bash
    npm install
    ```

3.  **Arrancar el servidor de Next.js**:
    ```bash
    npm run dev
    ```
4.  Accede a `http://localhost:3000`. 
5.  *Nota*: Si no tienes un `data.json` creado, el sistema lo generará automáticamente usando el esquema predeterminado en `lib/db.js` en tu primer inicio, creando el usuario admin (`admin` / `password123`).

## ✨ Flujo de Vistas Integrado

El administrador puede usar la **Vista Colaborador**, que invoca secretamente los componentes visuales del `/employee` para renderizarlos sobre un modal intermedio, logrando visualizar el software con "los ojos del trabajador" sin tener que cerrar e iniciar sesión.
