# Zenda WhatsApp API

API para integración con la plataforma WhatsApp Business desarrollada para Zenda.

## Requisitos

- Node.js (v14 o superior)
- NPM o Yarn

## Instalación

1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd zenda-wp-api
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar variables de entorno

```bash
cp env.example .env
```

Edita el archivo `.env` con tus configuraciones.

## Scripts disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con hot-reload
- `npm run build`: Compila el proyecto TypeScript a JavaScript
- `npm start`: Inicia el servidor en modo producción
- `npm run lint`: Ejecuta el linter para verificar el código
- `npm run lint:fix`: Corrige automáticamente problemas del linter

## Estructura del proyecto

```
zenda-wp-api/
├── dist/               # Código compilado (generado)
├── src/                # Código fuente
│   ├── config/         # Configuraciones
│   ├── controllers/    # Controladores
│   ├── interfaces/     # Interfaces y tipos de TypeScript
│   ├── middlewares/    # Middlewares de Express
│   ├── models/         # Modelos de datos
│   ├── routes/         # Rutas de la API
│   ├── services/       # Servicios
│   └── utils/          # Utilidades
├── .env                # Variables de entorno (no versionado)
├── .eslintrc.json      # Configuración de ESLint
├── .gitignore          # Archivos ignorados por Git
├── nodemon.json        # Configuración de Nodemon
├── package.json        # Dependencias y scripts
└── tsconfig.json       # Configuración de TypeScript
```

## Endpoints de la API

### Webhook de WhatsApp

- **GET /api/whatsapp/webhook**: Verificación del webhook de WhatsApp
- **POST /api/whatsapp/webhook**: Recepción de mensajes y eventos de WhatsApp

### Envío de mensajes

- **POST /api/whatsapp/send**: Envía mensajes a través de WhatsApp

## Licencia

ISC
