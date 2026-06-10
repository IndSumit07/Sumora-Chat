import mongoose from 'mongoose';
import logger from './logger.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let retryCount = 0;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 5,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
  };

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB Atlas connected successfully');
    retryCount = 0;
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
    scheduleReconnect();
  });

  const scheduleReconnect = () => {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(`MongoDB reconnect attempt ${retryCount}/${MAX_RETRIES} in ${RETRY_INTERVAL_MS / 1000}s`);
      setTimeout(() => {
        mongoose.connect(mongoUri, options).catch((err) => {
          logger.error(`MongoDB reconnect failed: ${err.message}`);
        });
      }, RETRY_INTERVAL_MS);
    } else {
      logger.error('MongoDB max reconnection attempts reached. Exiting.');
      process.exit(1);
    }
  };

  try {
    await mongoose.connect(mongoUri, options);
    logger.info(`MongoDB connected to: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error(`Initial MongoDB connection failed: ${err.message}`);
    scheduleReconnect();
  }
};

export const checkDBConnection = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

export default connectDB;
