import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../authServer/authServer"; // Import the Express app

import dotenv from "dotenv";
dotenv.config();

console.log("MongoDB URI:", process.env.MONGO_URI);

// MongoDB connection setup for testing
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected");
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
  console.log("MongoDB disconnected");
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

  it("should login with the registered user", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "password" });
    console.log("Login Response:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
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
    expect(res.status).toBe(401); // Adjusted to expect 401 for invalid token
  });
});
