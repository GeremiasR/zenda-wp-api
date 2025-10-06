import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Zenda WhatsApp API",
    version: "1.0.0",
    description:
      "API para gestión de WhatsApp con flujos conversacionales y autenticación JWT",
    contact: {
      name: "Equipo de Desarrollo Zenda",
      email: "dev@zenda.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Servidor de desarrollo",
    },
    {
      url: "https://api.zenda.com/api",
      description: "Servidor de producción",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT para autenticación",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Error message",
          },
          statusCode: {
            type: "integer",
            example: 400,
          },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation successful",
          },
        },
      },
      // Auth Schemas
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@zenda.com",
            description: "Email del usuario",
          },
          password: {
            type: "string",
            minLength: 6,
            example: "admin123",
            description: "Contraseña del usuario",
          },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          access_token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            description: "Token de acceso JWT",
          },
          refresh_token: {
            type: "string",
            example: "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
            description: "Token de renovación",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refresh_token"],
        properties: {
          refresh_token: {
            type: "string",
            example: "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
            description: "Token de renovación",
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
            description: "ID único del usuario",
          },
          username: {
            type: "string",
            example: "admin",
            description: "Nombre de usuario",
          },
          email: {
            type: "string",
            format: "email",
            example: "admin@zenda.com",
            description: "Email del usuario",
          },
          roleCode: {
            type: "string",
            enum: ["ADMIN", "SHOPADMIN", "SHOPUSER", "CUSTOMER"],
            example: "ADMIN",
            description: "Código del rol del usuario",
          },
          shopId: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d1",
            description: "ID de la tienda asociada",
          },
          isActive: {
            type: "boolean",
            example: true,
            description: "Estado activo del usuario",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de creación",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de última actualización",
          },
        },
      },
      // WhatsApp Schemas
      WhatsAppSession: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
            description: "ID único de la sesión",
          },
          sessionName: {
            type: "string",
            example: "zenda-session",
            description: "Nombre de la sesión",
          },
          isConnected: {
            type: "boolean",
            example: true,
            description: "Estado de conexión",
          },
          qrCode: {
            type: "string",
            example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            description: "Código QR para conectar WhatsApp",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de creación",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de última actualización",
          },
        },
      },
      // Flow Schemas
      Flow: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
            description: "ID único del flujo",
          },
          name: {
            type: "string",
            example: "Flujo de Bienvenida",
            description: "Nombre del flujo",
          },
          description: {
            type: "string",
            example: "Flujo de bienvenida para nuevos usuarios",
            description: "Descripción del flujo",
          },
          phoneNumber: {
            type: "string",
            example: "+1234567890",
            description: "Número de teléfono asociado",
          },
          shopId: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d1",
            description: "ID de la tienda",
          },
          isActive: {
            type: "boolean",
            example: true,
            description: "Estado activo del flujo",
          },
          isDeleted: {
            type: "boolean",
            example: false,
            description: "Estado de eliminación del flujo",
          },
          initialState: {
            type: "string",
            example: "menu",
            description: "Estado inicial del flujo",
          },
          states: {
            type: "object",
            description: "Estados del flujo",
            additionalProperties: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de creación",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Fecha de última actualización",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Auth",
      description: "Endpoints de autenticación y autorización",
    },
    {
      name: "WhatsApp",
      description: "Endpoints para gestión de sesiones de WhatsApp",
    },
    {
      name: "Flows",
      description: "Endpoints para gestión de flujos conversacionales",
    },
    {
      name: "Health",
      description: "Endpoints de salud y estado del sistema",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./docs/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
