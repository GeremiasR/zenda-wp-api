import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../../docs/swagger.config";

/**
 * Configura Swagger UI para la documentación de la API
 */
export const setupSwagger = (app: Express): void => {
  // Configuración de Swagger UI
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: "none",
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    `,
    customSiteTitle: "Zenda WhatsApp API - Documentación",
  };

  // Servir la documentación de Swagger
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions)
  );

  // Endpoint para obtener el JSON de Swagger
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("📚 Swagger UI disponible en: http://localhost:3000/api-docs");
  console.log(
    "📄 Swagger JSON disponible en: http://localhost:3000/api-docs.json"
  );
};
