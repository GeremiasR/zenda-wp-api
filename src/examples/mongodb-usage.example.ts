// /**
//  * Ejemplos de uso de MongoDB en la aplicación Zenda WhatsApp API
//  *
//  * Este archivo muestra cómo usar los modelos y servicios de MongoDB
//  * que se han configurado en el proyecto.
//  */

// import { WhatsAppSession } from '../models';
// import { databaseService } from '../services/database.service';
// import { handleDatabaseError } from '../utils/database.utils';

// /**
//  * Ejemplo de cómo crear y guardar una sesión de WhatsApp
//  */
// export async function createWhatsAppSession() {
//   try {
//     // Verificar que la base de datos esté conectada
//     if (!databaseService.getConnectionStatus()) {
//       throw new Error('Base de datos no conectada');
//     }

//     // Crear una nueva sesión
//     const session = new WhatsAppSession({
//       sessionId: 'session-' + Date.now(),
//       phoneNumber: '+1234567890',
//       isConnected: true,
//       qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', // QR code base64
//     });

//     // Guardar en la base de datos
//     const savedSession = await session.save();
//     console.log('Sesión creada:', savedSession);

//     return savedSession;
//   } catch (error) {
//     console.error('Error al crear sesión:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo buscar sesiones activas
//  */
// export async function getActiveSessions() {
//   try {
//     const activeSessions = await WhatsAppSession.findActiveSessions();
//     console.log('Sesiones activas:', activeSessions);
//     return activeSessions;
//   } catch (error) {
//     console.error('Error al buscar sesiones activas:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo actualizar una sesión
//  */
// export async function updateSession(sessionId: string, updateData: any) {
//   try {
//     const session = await WhatsAppSession.findOneAndUpdate(
//       { sessionId },
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!session) {
//       throw new Error('Sesión no encontrada');
//     }

//     console.log('Sesión actualizada:', session);
//     return session;
//   } catch (error) {
//     console.error('Error al actualizar sesión:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo eliminar una sesión
//  */
// export async function deleteSession(sessionId: string) {
//   try {
//     const session = await WhatsAppSession.findOneAndDelete({ sessionId });

//     if (!session) {
//       throw new Error('Sesión no encontrada');
//     }

//     console.log('Sesión eliminada:', session);
//     return session;
//   } catch (error) {
//     console.error('Error al eliminar sesión:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo limpiar sesiones inactivas
//  */
// export async function cleanInactiveSessions() {
//   try {
//     const result = await WhatsAppSession.cleanInactiveSessions();
//     console.log('Sesiones inactivas limpiadas:', result);
//     return result;
//   } catch (error) {
//     console.error('Error al limpiar sesiones inactivas:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo buscar una sesión por número de teléfono
//  */
// export async function findSessionByPhone(phoneNumber: string) {
//   try {
//     const session = await WhatsAppSession.findOne({ phoneNumber });

//     if (!session) {
//       console.log('No se encontró sesión para el número:', phoneNumber);
//       return null;
//     }

//     console.log('Sesión encontrada:', session);
//     return session;
//   } catch (error) {
//     console.error('Error al buscar sesión por teléfono:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de cómo obtener estadísticas de sesiones
//  */
// export async function getSessionStats() {
//   try {
//     const totalSessions = await WhatsAppSession.countDocuments();
//     const activeSessions = await WhatsAppSession.countDocuments({ isConnected: true });
//     const inactiveSessions = totalSessions - activeSessions;

//     const stats = {
//       total: totalSessions,
//       active: activeSessions,
//       inactive: inactiveSessions,
//       activePercentage: totalSessions > 0 ? (activeSessions / totalSessions) * 100 : 0
//     };

//     console.log('Estadísticas de sesiones:', stats);
//     return stats;
//   } catch (error) {
//     console.error('Error al obtener estadísticas:', handleDatabaseError(error));
//     throw error;
//   }
// }

// /**
//  * Ejemplo de uso completo
//  */
// export async function exampleUsage() {
//   try {
//     console.log('=== Ejemplo de uso de MongoDB ===');

//     // Crear una sesión
//     const session = await createWhatsAppSession();

//     // Buscar sesiones activas
//     await getActiveSessions();

//     // Actualizar la sesión
//     await updateSession(session.sessionId, {
//       lastSeen: new Date(),
//       connectionData: { version: '1.0.0' }
//     });

//     // Obtener estadísticas
//     await getSessionStats();

//     // Buscar por teléfono
//     await findSessionByPhone(session.phoneNumber);

//     // Limpiar sesiones inactivas
//     await cleanInactiveSessions();

//     console.log('=== Ejemplo completado ===');
//   } catch (error) {
//     console.error('Error en el ejemplo:', error);
//   }
// }
