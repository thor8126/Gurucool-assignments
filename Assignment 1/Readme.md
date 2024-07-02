**Flow Distribution Algorithm: Design and Implementation**

The flow distribution algorithm in this system efficiently manages task assignments for users. It leverages both MongoDB for persistent user data storage and Redis for real-time task queuing.

**Design Principles:**

1. **Scalability:** The design allows the system to handle a growing number of users and tasks gracefully. Redis, an in-memory data store, is optimized for fast queue operations, ensuring efficient task distribution.

2. **Isolation:** Each user has a dedicated queue (`queue_[userId]`) in Redis. This isolation prevents task conflicts and ensures that tasks are processed in the order they are submitted for each user.

3. **Authentication and Authorization:** The system incorporates JWT (JSON Web Token) authentication to secure task submission and access to protected routes. Only authenticated users can enqueue tasks or access protected resources.

4. **Persistence:** MongoDB stores user credentials securely, ensuring that user accounts and authentication information are persistent.

5. **Flexibility:** The task payload (the `task` object sent in the request) can be customized to include various data types and structures depending on your application's requirements. This allows for flexibility in the types of tasks you can handle.

**Algorithm Logic:**

1. **User Registration and Login:**

   - Users register by providing a username and password, which are hashed and stored in MongoDB.
   - Upon successful login, a JWT is generated and sent to the user.

2. **Task Enqueuing (`/enqueue` endpoint):**

   - The client sends a POST request to `/enqueue` with a JSON body containing the `task` object and includes the JWT in the `Authorization` header.
   - The server verifies the token to authenticate the user.
   - The server extracts the `userId` from the token.
   - The task is serialized (converted to JSON) and pushed onto the user's dedicated queue (`queue_[userId]`) in Redis.

3. **Task Processing (Not shown in code):**

   - In a separate process (not shown in the provided code), you would typically have a worker or consumer that continuously polls Redis queues for tasks.
   - The worker pops a task from the queue, processes it according to your application's logic, and then moves on to the next task.

4. **Protected Route (`/protected-route` endpoint):**
   - This endpoint demonstrates how you can protect resources using the `authenticateToken` middleware.
   - Only requests with a valid JWT in the `Authorization` header can access this route.

**API Endpoints:**

| Endpoint           | Method | Description                                   | Authentication |
| ------------------ | ------ | --------------------------------------------- | -------------- |
| `/register`        | POST   | Registers a new user.                         | No             |
| `/login`           | POST   | Authenticates a user and returns a JWT.       | No             |
| `/enqueue`         | POST   | Adds a task to the user's queue.              | Yes (JWT)      |
| `/protected-route` | GET    | A protected route accessible only with a JWT. | Yes (JWT)      |

**Interacting with the API:**

1. **Registration:** Send a POST request to `/register` with `username` and `password` in the request body.

2. **Login:** Send a POST request to `/login` with `username` and `password`. Receive a JWT in the response.

3. **Enqueue Task:** Send a POST request to `/enqueue` with the `task` object in the body and include the JWT in the `Authorization` header:

   ```
   Authorization: Bearer <your_jwt_token>
   ```

4. **Access Protected Route:** Send a GET request to `/protected-route` with the JWT in the `Authorization` header.

**Key Considerations:**

- **Error Handling:** Implement robust error handling to manage cases like invalid tokens, database errors, and Redis failures.

- **Queue Management:** Develop your task processing logic to efficiently handle tasks dequeued from Redis.

- **Security:** Always prioritize security best practices to protect user data and prevent unauthorized access. Consider implementing HTTPS for secure communication.
