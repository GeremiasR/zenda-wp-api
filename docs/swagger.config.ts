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
      // Shop Schema
      Shop: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
            description: "ID único de la tienda",
          },
          name: {
            type: "string",
            example: "Tienda Principal",
            description: "Nombre de la tienda",
          },
          internalName: {
            type: "string",
            example: "tienda-principal",
            description: "Nombre interno único de la tienda",
          },
          isActive: {
            type: "boolean",
            example: true,
            description: "Estado activo de la tienda",
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
      // WhatsApp Multitenant Schemas
      WhatsAppMultitenantActivateRequest: {
        type: "object",
        required: ["shopId", "flowId"],
        properties: {
          shopId: {
            type: "string",
            example: "shop_123",
            description: "ID único del shop",
          },
          flowId: {
            type: "string",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
            description: "ID del flujo de conversación a usar",
          },
        },
      },
      WhatsAppMultitenantActivateResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "QR generado exitosamente",
          },
          data: {
            type: "object",
            properties: {
              shopId: {
                type: "string",
                example: "shop_123",
              },
              flowId: {
                type: "string",
                example: "64f8a1b2c3d4e5f6a7b8c9d0",
                description: "ID del flujo de conversación",
              },
              sessionId: {
                type: "string",
                example: "shop_123_64f8a1b2c3d4e5f6a7b8c9d0",
                description: "ID de la sesión generada",
              },
              qr: {
                type: "string",
                example: "2@ABC123DEF456...",
                description: "Código QR para conectar WhatsApp",
              },
            },
          },
        },
      },
      WhatsAppMultitenantStatus: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Estado obtenido exitosamente",
          },
          data: {
            type: "object",
            properties: {
              shopId: {
                type: "string",
                example: "shop_123",
              },
              isActive: {
                type: "boolean",
                example: true,
                description: "Si la sesión está activa en memoria",
              },
              isConnected: {
                type: "boolean",
                example: true,
                description: "Si WhatsApp está conectado",
              },
              qr: {
                type: "string",
                example: "2@ABC123DEF456...",
                description: "Código QR actual (si existe)",
              },
              phoneNumber: {
                type: "string",
                example: "5491123456789@s.whatsapp.net",
                description: "Número de WhatsApp conectado",
              },
              lastConnection: {
                type: "string",
                format: "date-time",
                example: "2024-01-15T10:30:00.000Z",
                description: "Última conexión exitosa",
              },
            },
          },
        },
      },
      WhatsAppMultitenantSendMessageRequest: {
        type: "object",
        required: ["shopId", "jid", "message"],
        properties: {
          shopId: {
            type: "string",
            example: "shop_123",
            description: "ID del shop",
          },
          jid: {
            type: "string",
            example: "5491123456789@s.whatsapp.net",
            description: "JID del destinatario",
          },
          message: {
            type: "string",
            example: "Hola! ¿Cómo estás?",
            description: "Mensaje a enviar",
          },
        },
      },
      WhatsAppMultitenantSendGroupMessageRequest: {
        type: "object",
        required: ["shopId", "groupJid", "message"],
        properties: {
          shopId: {
            type: "string",
            example: "shop_123",
            description: "ID del shop",
          },
          groupJid: {
            type: "string",
            example: "120363123456789012@g.us",
            description: "JID del grupo",
          },
          message: {
            type: "string",
            example: "Mensaje para el grupo",
            description: "Mensaje a enviar al grupo",
          },
        },
      },
      WhatsAppMultitenantActiveSessions: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Sesiones activas obtenidas",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                shopId: {
                  type: "string",
                  example: "shop_123",
                },
                isConnected: {
                  type: "boolean",
                  example: true,
                },
                phoneNumber: {
                  type: "string",
                  example: "5491123456789@s.whatsapp.net",
                },
                lastConnection: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-15T10:30:00.000Z",
                },
              },
            },
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
      description:
        "Endpoints para gestión de sesiones de WhatsApp (API original)",
    },
    {
      name: "WhatsApp Multitenant",
      description:
        "Endpoints para gestión de WhatsApp por shop (API multitenant)",
    },
    {
      name: "Flows",
      description: "Endpoints para gestión de flujos conversacionales",
    },
    {
      name: "Admin",
      description:
        "Endpoints de administración del sistema (requiere rol ADMIN)",
    },
    {
      name: "Health",
      description: "Endpoints de salud y estado del sistema",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./docs/routes/*.ts"], // Solo leer documentación de la carpeta docs
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
