// authServer.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { redisClient } from "../db/db.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// connectDB();
// connectRedis();

const secret = process.env.JWT_SECRET;

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.sendStatus(400);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.sendStatus(201);
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
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
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
});

app.get("/protected-route", authenticateToken, (req, res) => {
  res.json({ message: "Access granted" });
});

export { app, redisClient, mongoose };
