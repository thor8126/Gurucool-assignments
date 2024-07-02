import express from "express";
import { collectDefaultMetrics, register } from "prom-client";
import { Counter, Histogram } from "prom-client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { redisClient } from "../db/db.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.js";
import logger from "../logger/logger.js";

dotenv.config();
collectDefaultMetrics({ register });

const requestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const requestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const app = express();
app.use(bodyParser.json());
app.use(express.json());

app.use(express.json());

app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      route: req.route.path,
      status: res.statusCode.toString(),
    });
    end({
      method: req.method,
      route: req.route.path,
      status: res.statusCode.toString(),
    });
  });
  next();
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err);
  }
});

// connectDB();
// connectRedis();

const secret = process.env.JWT_SECRET;

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send("Missing fields");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.sendStatus(201);
    logger.info(`User registered: ${username}`); // Log successful user registration
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`); // Log registration error
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.sendStatus(400);
  }
  const user = await User.findOne({ username });
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });
      res.json({ token });
      logger.info(`User logged in: ${username}`); // Log successful user login
    } else {
      res.sendStatus(401);
      logger.error(`Login failed for user ${username}: Incorrect password`); // Log incorrect password
    }
  } else {
    res.sendStatus(401);
    logger.error(`Login failed: User ${username} not found`); // Log user not found
  }
});

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

app.post("/enqueue", authenticateToken, async (req, res) => {
  const { task } = req.body;
  const userId = req.user.id;
  const queueName = `queue_${userId}`;
  await redisClient.rPush(queueName, JSON.stringify(task));
  res.json({ message: "Task added to queue" });
  logger.info(`Task added to queue by user ID ${userId}`); // Log task enqueue operation
});

app.get("/protected-route", authenticateToken, (req, res) => {
  res.json({ message: "Access granted" });
});

export { app, redisClient, mongoose };
