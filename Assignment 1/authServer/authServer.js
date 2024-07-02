import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.connect().catch(console.error);

console.log("Loaded environment variables:", process.env);
console.log("Mongo URI:", process.env.MONGO_URI);

async function db() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,
      useNewUrlParser: true,
      useUnifiedTopology: true, // Add this option for MongoDB connection
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
    throw err;
  }
}

db();

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

const secret = process.env.JWT_SECRET;

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.sendStatus(201);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });
      res.json({ token });
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
});

// Middleware to check the token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
};

// Endpoint to add tasks to the queue
app.post("/enqueue", authenticateToken, async (req, res) => {
  const { task } = req.body;
  const userId = req.user.id;
  const queueName = `queue_${userId}`;
  await redisClient.rPush(queueName, JSON.stringify(task));
  res.json({ message: "Task added to queue" });
});

// Protected route
app.get("/protected-route", authenticateToken, (req, res) => {
  res.json({ message: "Access granted" });
});

export default app;
