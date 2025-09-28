import mongoose from "mongoose";
import config from "../config";

class DatabaseService {
  private static instance: DatabaseService;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("MongoDB ya está conectado");
      return;
    }

    try {
      const { uri } = config.database;
      
      console.log("Conectando a MongoDB...");
      
      await mongoose.connect(uri);
      
      this.isConnected = true;
      console.log(`MongoDB conectado exitosamente a: ${uri}`);

      // Configurar eventos de conexión
      mongoose.connection.on("error", (error) => {
        console.error("Error de conexión a MongoDB:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB desconectado");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconectado");
        this.isConnected = true;
      });

      // Manejar cierre de la aplicación
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error("Error al conectar con MongoDB:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log("MongoDB no está conectado");
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("MongoDB desconectado exitosamente");
    } catch (error) {
      console.error("Error al desconectar de MongoDB:", error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}

export const databaseService = DatabaseService.getInstance();
export default databaseService;
