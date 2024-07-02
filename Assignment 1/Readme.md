## Authentication Service with Task Queue and Monitoring

### Overview

This project implements a secure authentication server with task queuing capabilities, leveraging:

- **Express.js:** Web framework for building RESTful APIs.
- **MongoDB:** Database for storing user credentials (username/password).
- **Redis:** In-memory data store for user-specific task queues.
- **Prom-Client:** Library for exposing Prometheus metrics for monitoring.
- **Bcrypt:** For securely hashing passwords.
- **JSON Web Tokens (JWT):** For secure user authentication and authorization.
- **Winston:** Logging library.

### System Architecture Diagram

```
+-------------------+  +-------------------+   +-------------------+
| Authentication    |  |      Redis        |   |      MongoDB      |
| Server           |->| (Task Queues)      |   | (User Credentials) |
| (authServer.js)  |  +-------------------+   +-------------------+
+-------------------+
      |
      v
+-------------------+
|   Prometheus      |
| (Metrics Scraping)|
+-------------------+
```

### Workflow

1. **User Registration:**

   - The user submits a username and password to `/register`.
   - The password is hashed using Bcrypt.
   - The user data is stored in MongoDB.

2. **User Login:**

   - The user provides credentials to `/login`.
   - The server verifies the password against the stored hash.
   - If successful, a JWT is generated and returned to the user.

3. **Task Enqueuing (Authenticated):**

   - Authenticated users send tasks to `/enqueue`.
   - The task is added to the user's specific Redis queue (`queue_<userId>`).

4. **Task Processing (Not Implemented):**

   - (To be added) A separate worker process would continuously poll Redis queues and process tasks.

5. **Protected Route Access (Authenticated):**

   - The `/protected-route` is accessible only with a valid JWT.

6. **Prometheus Metrics:**
   - The `/metrics` endpoint exposes data for monitoring:
     - HTTP request totals (by method, route, status code)
     - HTTP request durations (histogram)
     - Default Node.js process metrics

### Code Structure (authServer.js)

1. **Imports and Setup:**

   - Import modules, configure Prometheus, initialize Express, and set up middleware.

2. **Metrics Endpoint:**

   - Handles requests for Prometheus metrics.

3. **Authentication Endpoints:**

   - `POST /register`: Registers a new user.
   - `POST /login`: Authenticates users and provides JWTs.

4. **Authentication Middleware:**

   - Protects routes requiring authentication.

5. **Task Enqueuing Endpoint:**

   - `POST /enqueue`: Adds tasks to a user's queue.

6. **Protected Route:**
   - Demonstrates access control using JWTs.

### Test Suite (authServer.test.js)

- Uses Supertest for end-to-end testing.
- Covers registration, login, enqueuing, protected route access, and metrics endpoint.
- Includes database setup and teardown.

### Logging (logger.js)

- Uses Winston for structured logging to the console and a file.
- Custom log format for clarity.

### Enhancements (Future Work)

1. **Task Worker:** Implement a worker process for task processing.
2. **Security:** Add HTTPS, input validation, and potentially rate limiting.
3. **Error Handling:** Improve error handling in routes.
4. **API Documentation:** Use a tool like Swagger or OpenAPI to create interactive API documentation.
5. **More Metrics:** Track additional metrics like queue size, task processing time, etc.

Let me know if you'd like any part of this documentation elaborated further or if you have other questions!
