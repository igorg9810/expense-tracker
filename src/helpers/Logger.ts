/* eslint-disable no-console */
import config from '../config';

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  info(message: string, ...args: unknown[]): void {
    if (!config.isProduction) {
      console.log(`${this.prefix}${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix}${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix}${message}`, ...args);
  }
}

export const logger = new Logger('ExpenseTracker');
