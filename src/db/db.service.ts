/* eslint-disable no-console */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { logger } from '../helpers/Logger';
import { initializeSchema } from './schema';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;
  private readonly dbPath: string;

  private constructor() {
    this.dbPath = config.dbPath;
    const dataDir = path.dirname(this.dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.initialize();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initialize(): void {
    try {
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        fileMustExist: false,
      });

      // Enable foreign keys support
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');

      // Always initialize schema to ensure tables exist
      initializeSchema(this.db);

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public close(): void {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database:', error);
      throw new Error('Failed to close database connection');
    }
  }

  // Helper method to run queries with error handling
  public executeQuery<T>(query: string, params: Record<string, unknown> = {}): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const statement = this.db.prepare(query);
      return statement.run(params) as T;
    } catch (error) {
      logger.error('Database query error:', error);
      if (error instanceof Error) {
        throw error; // Preserve the original error
      }
      throw new Error('Database query failed');
    }
  }

  // Helper method to fetch data with error handling
  public fetch<T>(query: string, params: Record<string, unknown> = {}): T[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const statement = this.db.prepare(query);
      return statement.all(params) as T[];
    } catch (error) {
      logger.error('Database fetch error:', error);
      if (error instanceof Error) {
        throw error; // Preserve the original error
      }
      throw new Error('Database fetch failed');
    }
  }
}

export const dbService = DatabaseService.getInstance();
export default dbService;
