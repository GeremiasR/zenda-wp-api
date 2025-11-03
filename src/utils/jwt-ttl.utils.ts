/**
 * Utilidades para calcular TTL desde formato JWT expiresIn
 */

/**
 * Convierte un formato de tiempo JWT (ej: "15m", "1h", "1d") a segundos
 * @param expiresIn Formato de tiempo (ej: "15m", "1h", "7d")
 * @returns TTL en segundos
 */
export function parseJWTExpiresInToSeconds(expiresIn: string): number {
  // Formato esperado: número seguido de unidad (s, m, h, d)
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    // Si no coincide, asumir que está en segundos o usar valor por defecto
    const parsed = parseInt(expiresIn, 10);
    return isNaN(parsed) ? 3600 : parsed; // 1 hora por defecto
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s": // segundos
      return value;
    case "m": // minutos
      return value * 60;
    case "h": // horas
      return value * 60 * 60;
    case "d": // días
      return value * 24 * 60 * 60;
    default:
      return 3600; // 1 hora por defecto
  }
}

