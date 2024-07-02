import { createClient } from "redis";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const secret = process.env.JWT_SECRET;

async function createQueueForUser(userId) {
  return userId;
}

async function authenticate(token) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded.id;
  } catch (error) {
    throw new Error("Authentication failed");
  }
}

async function handleRequest(token, request) {
  const userId = await authenticate(token);
  await createQueueForUser(userId);
  client.rpush(`queue_${userId}`, JSON.stringify(request));
}

client.connect().catch(console.error);
