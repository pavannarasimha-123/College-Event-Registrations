const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/college_event_db';

  if (primaryUri) {
    try {
      console.log(`[MongoDB] Attempting connection to configured database: ${primaryUri.split('@')[1] || primaryUri}`);
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected successfully to Cloud / Atlas: ${conn.connection.host}`);
      return conn;
    } catch (primaryError) {
      console.warn(`\n⚠️  [MongoDB Warning] Could not connect to Atlas (${primaryError.message}).`);
      console.warn('   Please check if the cluster URL is active and your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas.');
      console.log(`[MongoDB] Falling back to local MongoDB (${fallbackUri}) so your application keeps working...\n`);
    }
  }

  // Fallback to local MongoDB
  try {
    const fallbackConn = await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to local database: ${fallbackConn.connection.host}`);
    return fallbackConn;
  } catch (fallbackError) {
    console.error(`[MongoDB Fatal] Could not connect to local database either: ${fallbackError.message}`);
    throw fallbackError;
  }
};

module.exports = connectDB;
