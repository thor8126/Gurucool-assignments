// db.js
import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 50,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
};

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const connectRedis = async () => {
  await redisClient.connect();
  console.log("Connected to Redis");
};

export { connectDB, connectRedis, redisClient };
