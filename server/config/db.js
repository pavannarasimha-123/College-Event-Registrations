const mongoose = require('mongoose');

// Fallback Atlas URIs so Render can always reach MongoDB Atlas even if env vars are unset
const DEFAULT_ATLAS_SRV = 'mongodb+srv://pavan:xlSilyqIQplpuLPQ@cluster0.jxwmoeo.mongodb.net/college_event_db?retryWrites=true&w=majority&appName=Cluster0';
const DEFAULT_ATLAS_DIRECT = 'mongodb://pavan:xlSilyqIQplpuLPQ@ac-0fntmtz-shard-00-00.jxwmoeo.mongodb.net:27017,ac-0fntmtz-shard-00-01.jxwmoeo.mongodb.net:27017,ac-0fntmtz-shard-00-02.jxwmoeo.mongodb.net:27017/college_event_db?ssl=true&replicaSet=atlas-119dg4-shard-0&authSource=admin&retryWrites=true&w=majority';
const LOCAL_FALLBACK = 'mongodb://127.0.0.1:27017/college_event_db';

let isConnecting = false;
let retryTimer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return;
  }
  isConnecting = true;

  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  // Build list of candidate URIs in order of preference
  const urisToTry = [];
  if (primaryUri) {
    urisToTry.push(primaryUri);
  }
  // Direct replica set URI bypasses Linux / Render DNS SRV resolution issues
  if (!urisToTry.includes(DEFAULT_ATLAS_DIRECT)) {
    urisToTry.push(DEFAULT_ATLAS_DIRECT);
  }
  // Standard Atlas SRV connection
  if (!urisToTry.includes(DEFAULT_ATLAS_SRV)) {
    urisToTry.push(DEFAULT_ATLAS_SRV);
  }
  // Local fallback for offline local development only
  if (!isProduction && !urisToTry.includes(LOCAL_FALLBACK)) {
    urisToTry.push(LOCAL_FALLBACK);
  }

  for (const uri of urisToTry) {
    try {
      const isDirect = uri.includes('ac-0fntmtz-shard');
      const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');
      const label = isLocal ? 'Local MongoDB' : (isDirect ? 'Atlas Direct Replica Set' : 'Atlas SRV');
      console.log(`[MongoDB] Attempting connection via ${label}...`);

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });

      console.log(`[MongoDB] Connected successfully via ${label}: ${conn.connection.host}`);
      isConnecting = false;
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      return conn;
    } catch (err) {
      console.warn(`[MongoDB Warning] Attempt failed: ${err.message}`);
    }
  }

  isConnecting = false;

  // If initial connection was unsuccessful, schedule automatic background retries
  if (!retryTimer) {
    console.log('[MongoDB] Scheduling background reconnection retry in 5s...');
    retryTimer = setInterval(() => {
      if (mongoose.connection.readyState !== 1) {
        connectDB().catch(() => {});
      } else {
        clearInterval(retryTimer);
        retryTimer = null;
      }
    }, 5000);
  }

  throw new Error('Could not connect to MongoDB Atlas. Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.');
};

module.exports = connectDB;
