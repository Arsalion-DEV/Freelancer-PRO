import { Sequelize } from 'sequelize';
import config from '@/config';
import { logger } from '@/utils/logger';

class Database {
  private static instance: Sequelize;

  public static getInstance(): Sequelize {
    if (!Database.instance) {
      Database.instance = Database.createConnection();
    }
    return Database.instance;
  }

  private static createConnection(): Sequelize {
    const { database: dbConfig } = config;

    let sequelize: Sequelize;

    if (dbConfig.type === 'sqlite') {
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbConfig.sqlitePath,
        logging: dbConfig.logging ? (sql) => logger.debug(sql) : false,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    } else {
      sequelize = new Sequelize({
        dialect: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
        password: dbConfig.password,
        logging: dbConfig.logging ? (sql) => logger.debug(sql) : false,
        dialectOptions: {
          ssl: dbConfig.ssl ? {
            require: true,
            rejectUnauthorized: false,
          } : false,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    }

    return sequelize;
  }

  public static async connect(): Promise<void> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      logger.info(`Database connected successfully (${config.database.type})`);
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  public static async sync(options: { force?: boolean; alter?: boolean } = {}): Promise<void> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.sync(options);
      logger.info('Database synchronized successfully');
    } catch (error) {
      logger.error('Error synchronizing database:', error);
      throw error;
    }
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }
}

export default Database;
export const sequelize = Database.getInstance();