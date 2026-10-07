import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { User } from '../src/models/User.js';
import { Column } from '../src/models/Column.js';
import { OF } from '../src/models/OF.js';

/**
 * Test database setup and teardown using MongoDB Memory Server.
 * 
 * Creates an in-memory MongoDB instance for testing.
 * This ensures complete isolation between test runs and no external dependencies.
 * Connects to the in-memory database before all tests,
 * cleans up collections after each test,
 * and stops the server after all tests are done.
 * 
 * @example
 * ```typescript
 * // In your test file
 * import './setup';
 * ```
 */
let mongoServer: MongoMemoryServer | undefined;

beforeAll(async () => {
  try {
    // Option CI 
    const externalUri = process.env.MONGO_TEST_URI;
    if (externalUri) {
      await mongoose.connect(externalUri, { serverSelectionTimeoutMS: 10000 });
      await mongoose.connection.dropDatabase();
      return;
    }

    // Create MongoDB Memory Server instance with optimized configuration
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'visiplus_test',
        launchTimeout: 30000,
      },
      binary: {
        version: '7.0.0',
      },
    });

    // Wait a bit to ensure server is fully started
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Get the connection URI
    const mongoUri = mongoServer.getUri();

    // Connect Mongoose to the in-memory database with timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Clean up all collections after each test
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Column.deleteMany({});
      await OF.deleteMany({});
    }
  } catch (error) {
    console.error('Error cleaning up collections:', error);
  }
});

afterAll(async () => {
  try {
    // Close Mongoose connection
    if (mongoose.connection.readyState !== 0) {
      if (process.env.MONGO_TEST_URI) await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Error closing Mongoose connection:', error);
  }

  try {
    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error stopping MongoDB Memory Server:', error);
  }
});

