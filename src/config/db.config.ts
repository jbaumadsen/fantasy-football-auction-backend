import mongoose from 'mongoose';

const connectDB = async (uri?: string): Promise<void> => {
  try {
    const dbUri = uri || process.env.MONGODB_URI;
    // console.log('process.env', process.env)

    if (!dbUri || dbUri === '') {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    await mongoose.connect(dbUri);

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully to ', dbUri);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      process.exit(1);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
