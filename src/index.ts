import { start } from './app';

start().catch((error: Error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});
