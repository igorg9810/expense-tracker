import Database from 'better-sqlite3';
import { logger } from '../helpers/Logger';

export const initializeSchema = (db: Database.Database): void => {
  try {
    // Create expenses table
    db.prepare(
      `
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency TEXT NOT NULL,
                category TEXT NOT NULL,
                date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `
    ).run();

    // Create an index on date for faster querying
    db.prepare(
      `
            CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)
        `
    ).run();

    // Create an index on category for faster filtering
    db.prepare(
      `
            CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
        `
    ).run();

    // Create trigger to automatically update updated_at timestamp
    db.prepare(
      `
            CREATE TRIGGER IF NOT EXISTS expenses_update_timestamp 
            AFTER UPDATE ON expenses
            BEGIN
                UPDATE expenses SET updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END
        `
    ).run();

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema:', error);
    throw new Error('Schema initialization failed');
  }
};
