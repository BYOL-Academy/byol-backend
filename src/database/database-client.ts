import { databaseConfiguration } from "@/config";
import { logger } from "@/utils/logger.util";
import { IDatabaseClient, IEntity, IRepository } from "@lib/database";
import mongoose, { Connection } from "mongoose";

class DatabaseClient implements IDatabaseClient {
  private _connection: Connection | null = null;

  get connection() {
    return this._connection;
  }

  async connect(): Promise<void> {
    try {
      mongoose.set("strictQuery", false);
      await mongoose.connect(databaseConfiguration.url, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this._connection = mongoose.connection;
      logger.debug(`MongoDB connection established successfully 👌 👌 👌`);
    } catch (error) {
      logger.error("Error connecting to MongoDB ‼️ ‼️ ‼️ ");
      logger.error(`Error message: ${(error as Error).message}`);
      process.exit(1);
    }
  }
  async disconnect(): Promise<void> {
    if (this._connection) {
      await mongoose.disconnect();
      this._connection = null;
    }
  }
  getRepository<T>(entity: IEntity): IRepository<T> {
    throw new Error("Method not implemented.");
  }
}

export const databaseClient: DatabaseClient = new DatabaseClient();
