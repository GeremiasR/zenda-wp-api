/**
 * Script para generar documentación de la API
 * Ejecutar con: node docs/generate-docs.js
 */

const fs = require("fs");
const path = require("path");

console.log("📚 Generando documentación de la API...\n");

// Función para leer archivos de documentación
function readDocFiles(dir) {
  const files = fs.readdirSync(dir);
  const docFiles = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      docFiles.push(...readDocFiles(filePath));
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      docFiles.push(filePath);
    }
  });

  return docFiles;
}

// Función para extraer comentarios de Swagger
function extractSwaggerComments(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const swaggerComments = [];

  // Buscar comentarios que contengan @swagger
  const swaggerRegex = /\/\*\*[\s\S]*?@swagger[\s\S]*?\*\//g;
  const matches = content.match(swaggerRegex);

  if (matches) {
    swaggerComments.push(...matches);
  }

  return swaggerComments;
}

// Función para contar endpoints
function countEndpoints(swaggerComments) {
  let count = 0;
  swaggerComments.forEach((comment) => {
    const lines = comment.split("\n");
    lines.forEach((line) => {
      if (line.trim().match(/^\*?\s*\/[a-zA-Z0-9\/\{\}]+:\s*$/)) {
        count++;
      }
    });
  });
  return count;
}

// Función para generar reporte
function generateReport() {
  const docsDir = path.join(__dirname);
  const routesDir = path.join(docsDir, "routes");

  console.log("🔍 Analizando archivos de documentación...\n");

  // Leer archivos de rutas
  const routeFiles = readDocFiles(routesDir);
  console.log(`📁 Archivos de rutas encontrados: ${routeFiles.length}`);
  routeFiles.forEach((file) => {
    console.log(`   - ${path.relative(docsDir, file)}`);
  });

  console.log("\n📊 Estadísticas de documentación:\n");

  let totalEndpoints = 0;
  let totalFiles = 0;

  routeFiles.forEach((file) => {
    const swaggerComments = extractSwaggerComments(file);
    const endpoints = countEndpoints(swaggerComments);

    console.log(`📄 ${path.basename(file)}:`);
    console.log(`   - Comentarios Swagger: ${swaggerComments.length}`);
    console.log(`   - Endpoints documentados: ${endpoints}`);
    console.log("");

    totalEndpoints += endpoints;
    totalFiles++;
  });

  console.log("📈 Resumen total:");
  console.log(`   - Archivos procesados: ${totalFiles}`);
  console.log(`   - Endpoints documentados: ${totalEndpoints}`);
  console.log(
    `   - Promedio por archivo: ${Math.round(totalEndpoints / totalFiles)}`
  );

  console.log("\n✅ Documentación generada exitosamente!");
  console.log("\n🌐 Para ver la documentación:");
  console.log("   1. Inicia el servidor: npm run dev");
  console.log("   2. Ve a: http://localhost:3000/api-docs");
  console.log("   3. Obtén el JSON: http://localhost:3000/api-docs.json");
}

// Ejecutar generación
try {
  generateReport();
} catch (error) {
  console.error("❌ Error al generar documentación:", error.message);
  process.exit(1);
}
