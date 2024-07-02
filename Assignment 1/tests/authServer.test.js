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
    console.log("Register User Response:", res.body);
    expect(res.status).toBe(201);
  });

  it("should fail registration with missing fields", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "testuser2" });
    console.log("Register User with Missing Fields Response:", res.body);
    expect(res.status).toBe(400);
  });

  it("should login with the registered user", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "password" });
    console.log("Login Response:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("should fail login with missing fields", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "testuser" });
    console.log("Login with Missing Fields Response:", res.body);
    expect(res.status).toBe(400);
  });

  it("should fail login with incorrect password", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "wrongpassword" });
    console.log("Failed Login Response:", res.body);
    expect(res.status).toBe(401);
  });

  it("should fail login with non-existing user", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "nonexistinguser", password: "password" });
    console.log("Non-existing User Login Response:", res.body);
    expect(res.status).toBe(401);
  });

  it("should access protected route with valid token", async () => {
    const res = await request(app)
      .get("/protected-route")
      .set("Authorization", `Bearer ${token}`);
    console.log("Access Protected Route Response:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access granted");
  });

  it("should fail to access protected route with invalid token", async () => {
    const res = await request(app)
      .get("/protected-route")
      .set("Authorization", "Bearer invalidtoken");
    console.log(
      "Access Protected Route with Invalid Token Response:",
      res.body
    );
    expect(res.status).toBe(401);
  });

  it("should fail to enqueue task without token", async () => {
    const res = await request(app)
      .post("/enqueue")
      .send({ task: "sample task" });
    console.log("Enqueue Task without Token Response:", res.body);
    expect(res.status).toBe(401);
  });

  it("should fail to enqueue task with invalid token", async () => {
    const res = await request(app)
      .post("/enqueue")
      .set("Authorization", "Bearer invalidtoken")
      .send({ task: "sample task" });
    console.log("Enqueue Task with Invalid Token Response:", res.body);
    expect(res.status).toBe(401);
  });

  it("should enqueue task with valid token", async () => {
    const res = await request(app)
      .post("/enqueue")
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "sample task" });
    console.log("Enqueue Task Response:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Task added to queue");
  });

  it("should process tasks from the queue", async () => {
    const userId = jwt.decode(token).id;
    const queueName = `queue_${userId}`;
    const task = await redisClient.lPop(queueName);
    expect(task).toBe(JSON.stringify("sample task"));
  });
});
