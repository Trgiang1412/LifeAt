import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://truonggiangk99_db_user:M6JLrbIS78odfHJh@ac-04gaqkl-shard-00-00.sojtecx.mongodb.net:27017,ac-04gaqkl-shard-00-01.sojtecx.mongodb.net:27017,ac-04gaqkl-shard-00-02.sojtecx.mongodb.net:27017/LifeAt?ssl=true&replicaSet=atlas-ejwbw9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

