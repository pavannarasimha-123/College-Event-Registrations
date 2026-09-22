const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  const fallbackUri = 'mongodb://127.0.0.1:27017/college_event_db';

  if (primaryUri) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[MongoDB] Connection attempt ${attempt}/${maxRetries} to: ${primaryUri.split('@')[1] || primaryUri}`);
        const conn = await mongoose.connect(primaryUri, {
          serverSelectionTimeoutMS: 20000, // Increased timeout for cloud cold starts
          connectTimeoutMS: 20000,
        });
        console.log(`[MongoDB] Connected successfully to Cloud / Atlas: ${conn.connection.host}`);
        return conn;
      } catch (primaryError) {
        console.warn(`[MongoDB] Attempt ${attempt} failed: ${primaryError.message}`);
        if (attempt < maxRetries) {
          console.log('[MongoDB] Retrying in 3 seconds...');
          await new Promise((res) => setTimeout(res, 3000));
        } else if (isProduction) {
          console.error('[MongoDB Fatal] All cloud connection attempts failed in production.');
          throw primaryError;
        }
      }
    }
  }

  // Fallback to local MongoDB only when running in development
  if (!isProduction) {
    try {
      console.log(`[MongoDB] Falling back to local MongoDB (${fallbackUri}) for development...`);
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected successfully to local database: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`[MongoDB Fatal] Could not connect to local database: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

module.exports = connectDB;
