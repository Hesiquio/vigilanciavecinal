#SISTEMA DE VIGILANCIA VECINAL: Colonia Segura (V1)
Colonia Segura es una aplicación de comunicación y gestión de alertas diseñada para apoyar a los ciudadanos que participan en grupos de trabajo y vigilancias vecinales. Permite la comunicación en tiempo real y la distribución rápida de alertas geolocalizadas.

Stack Tecnológico
Este proyecto ha sido desarrollado con tecnologías modernas y servicios en la nube para asegurar escalabilidad y rendimiento:
* Frontend Framework: Next.js (con React/TypeScript)
* Backend & BaaS: Google Firebase (Authentication, Firestore, Cloud Messaging para notificaciones).
* Diseño/UI: Tailwind CSS & Shadcn UI (Componentes de diseño modulares).
* Geolocalización: Integración con Google Maps API para visualización de alertas y posiciones de miembros.
* IA/Flujos de Trabajo: Google Genkit (`gemini-2.5-flash`) para tareas de backend, como la asignación de grupos de emergencia.

Funcionalidades Clave (V1)
Esta primera versión implementa las funcionalidades esenciales para la vigilancia comunitaria:
1.  Alertas SOS Instantáneas: Envío rápido de alertas geolocalizadas con categorización (Robo, Accidentes, Sospecha) a grupos seleccionados.
2.  Chats Separados por Comunidad:
    * Chat Vecinal: Agrupado automáticamente por Código Postal.
    * Chat Familiar: Con gestión de miembros y opción de compartir ubicación en tiempo real.
    * Grupos Personalizados: Creación y gestión de grupos manuales para proyectos específicos.
3.  Registro Seguro: Autenticación vía Google y proceso de Verificación de Zona para recopilar Código Postal y ubicación, cruciales para la agrupación vecinal.
4.  Sistema de Avisos: Publicación de comunicados no urgentes (juntas, eventos) dirigidos a audiencias específicas (vecinos, familia, grupos).

Estructura del Proyecto
El código está organizado de la siguiente manera:
* `/src/app/`: Rutas y páginas principales de la aplicación (Dashboard, Login, Grupos).
* `/src/components/`: Componentes reutilizables de UI y lógica (Modals, Dropdowns).
* `/src/firebase/`: Lógica de inicialización, hooks de datos (Firestore) y manejo de errores de permisos.
* `/src/types.ts`: Definición de todos los modelos de datos (SosAlert, UserProfile, ChatMessage, etc.).
* `/firestore.rules`: Reglas de seguridad de Firestore (Propiedad del documento y acceso a chats).

Instalación (Para Desarrolladores)
Para configurar el proyecto localmente, sigue estos pasos:
1.  Clonar el repositorio:
    ```bash
    git clone [https://github.com/Hesiquio/vigilanciavecinal.git](https://github.com/Hesiquio/vigilanciavecinal.git)
    cd vigilanciavecinal
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    # o si usas yarn: yarn install
    ```
3.  Configurar Firebase:
    * Crea un proyecto en la Consola de Firebase.
    * Copia tus credenciales en `src/firebase/config.ts` (¡Asegúrate de que este archivo NUNCA se suba a GitHub sin estar ya en `.gitignore`!)
    * Asegúrate de que los servicios de Authentication (Google), Firestore y Cloud Functions estén habilitados.
4.  Ejecutar la aplicación (Next.js):
    ```bash
    npm run dev
    ```