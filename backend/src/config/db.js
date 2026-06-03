import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB at ${env.mongoUri.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] MongoDB disconnected');
  });
}

export { connectDB };
