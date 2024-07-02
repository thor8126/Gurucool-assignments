// authServer.test.js

import request from "supertest";
import jwt from "jsonwebtoken";
import { app, redisClient, mongoose } from "../authServer/authServer";
import { connectDB, connectRedis } from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();

beforeAll(async () => {
  await connectDB();
  await connectRedis();
  console.log("MongoDB and Redis connected");
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  await redisClient.flushAll();
  await redisClient.quit();
  console.log("All connections disconnected");
});

describe("Authentication endpoints", () => {
  let token;

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "testuser", password: "password" });
    expect(res.status).toBe(201);
  });

  it("should login with the registered user", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "password" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("should enqueue multiple tasks with valid token", async () => {
    const tasks = ["task1", "task2", "task3"]; // Define multiple tasks to enqueue
    const enqueuePromises = tasks.map((task) =>
      request(app)
        .post("/enqueue")
        .set("Authorization", `Bearer ${token}`)
        .send({ task })
    );

    const enqueueResponses = await Promise.all(enqueuePromises);
    enqueueResponses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Task added to queue");
    });
  });

  it("should process tasks from the queue", async () => {
    const userId = jwt.decode(token).id;
    const queueName = `queue_${userId}`;

    // Ensure all tasks were enqueued properly
    const tasks = ["task1", "task2", "task3"];
    const redisTasks = await Promise.all(
      tasks.map(() => redisClient.lPop(queueName))
    );

    redisTasks.forEach((task, index) => {
      expect(task).toBe(JSON.stringify(tasks[index]));
    });
  });

  it("should fail to access protected route with invalid token", async () => {
    const res = await request(app)
      .get("/protected-route")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should fail to access protected route without token", async () => {
    const res = await request(app).get("/protected-route");
    expect(res.status).toBe(401);
  });

  it("should fail to enqueue task without token", async () => {
    const res = await request(app)
      .post("/enqueue")
      .send({ task: "sample task" });
    expect(res.status).toBe(401);
  });

  it("should fail to enqueue task with invalid token", async () => {
    const res = await request(app)
      .post("/enqueue")
      .set("Authorization", "Bearer invalidtoken")
      .send({ task: "sample task" });
    expect(res.status).toBe(401);
  });

  it("should access protected route with valid token", async () => {
    const res = await request(app)
      .get("/protected-route")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access granted");
  });

  it("should access Prometheus metrics endpoint", async () => {
    const res = await request(app).get("/metrics");
    console.log("Prometheus Metrics Response:", res.text);
    expect(res.status).toBe(200);
  });
});
