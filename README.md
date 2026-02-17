# Sistema de Gestión y Publicación de Horarios (PublicarHorarios)

## 📋 Descripción del Proyecto

**PublicarHorarios** es una aplicación web moderna diseñada para optimizar la gestión y distribución de horarios laborales. Su objetivo principal es reemplazar los métodos tradicionales y manuales (como el envío de PDFs por WhatsApp o impresiones físicas) por una plataforma digital centralizada, segura y accesible.

El flujo de trabajo se centra en la eficiencia:
1.  **Administrador**: Sube la planificación de horarios masivamente a través de archivos **Excel**. La aplicación procesa, valida y almacena esta información.
2.  **Empleado**: Accede a la plataforma mediante credenciales seguras (Código de Empleado) y visualiza únicamente su horario asignado, eliminando confusiones y garantizando la privacidad.

## 🚀 Tecnologías Utilizadas

Este proyecto utiliza un stack tecnológico de vanguardia para asegurar rendimiento, escalabilidad y una experiencia de usuario fluida (UX).

### Frontend (Cliente)
-   **[Next.js 16 (App Router)](https://nextjs.org/)**: Framework de React para producción. Maneja el enrutado, renderizado del lado del servidor (SSR) y optimización.
-   **[React 19](https://react.dev/)**: Librería para construir interfaces de usuario interactivas.
-   **[Tailwind CSS v4](https://tailwindcss.com/)**: Framework de utilidad para estilos rápidos, responsivos y modernos.
-   **[Framer Motion](https://www.framer.com/motion/)**: Biblioteca para animaciones fluidas y micro-interacciones que mejoran la experiencia del usuario.
-   **[Lucide React](https://lucide.dev/)**: Colección de iconos ligeros y consistentes.

### Backend (Servidor)
-   **Next.js API Routes**: Funciones serverless que manejan la lógica de negocio (autenticación, procesamiento de datos, CRUD de usuarios).
-   **Node.js**: Entorno de ejecución para la lógica del servidor.

### Procesamiento de Datos
-   **[SheetJS (xlsx)](https://docs.sheetjs.com/)**: Librería potente para leer, parsear y validar archivos Excel (.xlsx, .xls) directamente en el navegador o servidor, permitiendo la carga masiva de horarios.

### Base de Datos
-   **Estado Actual (Prototipo)**: Sistema de almacenamiento local basado en archivos JSON (`data.json`) para desarrollo rápido y pruebas de concepto.
-   **Producción (Planificado)**: Migración a una base de datos en la nube.
    -   *Opciones en evaluación*: **Google Firestore** (NoSQL, Escalable) o **PostgreSQL** (Relacional, Robusto via Supabase/Render).

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura **Monolítica Modular** basada en Next.js:

1.  **Capa de Presentación (Frontend)**:
    -   Componentes reutilizables (`/components`) como `ShiftGrid`, `WeeklyCalendar` y `BulkUpload`.
    -   Páginas (`/app`) separadas por roles: Dashboard de Admin y Vista de Empleado.
    -   **Context API**: Manejo del estado global de la sesión del usuario (`AuthContext`).

2.  **Capa de Lógica de Negocio (API/Backend)**:
    -   Endpoints RESTful en `/app/api/` que sirven como intermediarios entre el frontend y los datos.
    -   **Middleware**: Protección de rutas para asegurar que solo usuarios autenticados y con el rol correcto accedan a ciertas áreas (ej. solo Admins en `/admin`).

3.  **Flujo de Datos**:
    -   `Excel` -> `Frontend Parser` -> `API Bulk Upload` -> `Base de Datos`.
    -   `Login` -> `API Auth` -> `JWT/Sesión` -> `Acceso a Datos Personales`.

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/kelvinL55/PublicarHorarios.git
    cd PublicarHorarios
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Ejecutar servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## ✨ Características Principales

-   **Autenticación Segura**: Login diferenciado para Administradores y Empleados.
-   **Carga Masiva (Bulk Upload)**: Importación de miles de registros de horarios desde Excel en segundos.
-   **Gestión de Usuarios**: ABM (Alta, Baja, Modificación) de empleados.
-   **Vista de Calendario**: Visualización intuitiva de turnos semanales y mensuales.
-   **Diseño Responsivo**: Totalmente funcional en dispositivos móviles y de escritorio.

---
*Desarrollado por Kelvin.*
