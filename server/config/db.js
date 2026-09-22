const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  const fallbackUri = 'mongodb://127.0.0.1:27017/college_event_db';

  // Standard non-SRV connection string for cluster0.jxwmoeo.mongodb.net
  // This bypasses Linux/Render DNS SRV resolution issues completely
  const standardAtlasUri = 'mongodb://pavan:xlSilyqIQplpuLPQ@ac-0fntmtz-shard-00-00.jxwmoeo.mongodb.net:27017,ac-0fntmtz-shard-00-01.jxwmoeo.mongodb.net:27017,ac-0fntmtz-shard-00-02.jxwmoeo.mongodb.net:27017/college_event_db?ssl=true&replicaSet=atlas-119dg4-shard-0&authSource=admin&retryWrites=true&w=majority';

  const urisToTry = [];
  if (primaryUri) urisToTry.push(primaryUri);
  // If primary is an SRV URI, add the direct standard replica set URI as a backup
  if (primaryUri && primaryUri.includes('cluster0.jxwmoeo.mongodb.net') && primaryUri.startsWith('mongodb+srv:')) {
    urisToTry.push(standardAtlasUri);
  }

  for (const uri of urisToTry) {
    try {
      const isDirect = uri.startsWith('mongodb://ac-');
      console.log(`[MongoDB] Attempting ${isDirect ? 'DIRECT REPLICA SET' : 'SRV'} connection to: ${uri.split('@')[1] ? uri.split('@')[1].split('?')[0] : 'cluster'}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      console.log(`[MongoDB] Connected successfully to Cloud / Atlas: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[MongoDB] Connection to ${uri.startsWith('mongodb+srv:') ? 'SRV' : 'Direct'} failed: ${err.message}`);
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
  } else {
    throw new Error('Could not connect to MongoDB Atlas in production. Please check IP Access List (0.0.0.0/0).');
  }
};

module.exports = connectDB;
