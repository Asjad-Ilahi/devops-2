import mongoose, { Mongoose } from "mongoose";

// Define the global type for caching
declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

// Check for MONGODB_URI at the top level and throw if undefined
if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Assign the environment variable to a constant after validation
const MONGODB_URI: string = process.env.MONGODB_URI;

// Initialize cached connection from global scope
let cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes a connection to MongoDB with caching.
 * @returns {Promise<Mongoose>} The Mongoose instance with an established connection.
 * @throws {Error} If the connection fails or MONGODB_URI is invalid.
 */
export default async function dbConnect(): Promise<Mongoose> {
  try {
    // Return cached connection if it exists
    if (cached.conn) {
      console.log("Reusing cached MongoDB connection");
      return cached.conn;
    }

    // If no connection promise exists, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false, // Fail immediately if disconnected
        serverSelectionTimeoutMS: 30000, // 30s timeout for server selection
        connectTimeoutMS: 30000, // 30s timeout for initial connection
      };

      console.log("Initiating MongoDB connection with URI:", MONGODB_URI.replace(/\/\/.*@/, '//****@')); // Mask credentials in logs
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
        console.log("MongoDB connected successfully");
        return mongooseInstance;
      }).catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        throw error; // Propagate error for upstream handling
      });
    }

    // Await the connection promise and cache the result
    cached.conn = await cached.promise;
    const state = cached.conn.connection.readyState;
    console.log("Connection state:", state); // 1 = connected, 0 = disconnected, 2 = connecting
    if (state !== 1) {
      throw new Error(`Connection not established, state: ${state}`);
    }

    return cached.conn;
  } catch (error) {
    console.error("Error in dbConnect:", error);
    throw error; // Re-throw for API route or caller to handle
  }
}

// Optional: Export a disconnect function for cleanup (e.g., in tests)
export async function dbDisconnect(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("MongoDB disconnected successfully");
  }
}