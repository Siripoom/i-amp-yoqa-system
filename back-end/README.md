Here is the **README.md** file in English for your project, explaining how to run the server using Docker:

---

# Yoga Online System Backend

## Table of Contents

- [About the Project](#about-the-project)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running with Docker](#running-with-docker)
- [Managing Docker Containers](#managing-docker-containers)

---

## About the Project

**Yoga Online System** is a backend system built with Node.js and Express, designed to manage users, yoga courses, and instructors. The system connects to MongoDB for data storage and uses Docker to easily manage the development and deployment environment.

---

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

- [Docker](https://docs.docker.com/get-docker/) - For running Docker containers and Docker Compose
- [Node.js](https://nodejs.org/) (only required for local development, not needed if using Docker)

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/username/yoga-online-system-backend.git
cd yoga-online-system-backend
```

### 2. Install Dependencies (Optional: For local development)

If you are developing locally without Docker, install the dependencies:

```bash
npm install
```

---

## Running with Docker

To run this project using Docker, follow these steps:

### 1. Create a `.env` file

Create a `.env` file in the root directory to store environment variables like your MongoDB connection URL and JWT secret.

Example `.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mydatabase?retryWrites=true&w=majority
JWT_SECRET=mysecretkey
```

### 2. Build and Run Docker Containers

Use Docker Compose to build and run your backend and MongoDB services:

```bash
docker-compose up --build
```

This command will:

- Build the Docker image for the backend
- Start MongoDB on port `27017`
- Start the backend server on port `5000`

### 3. Check Container Status

To check the status of the running containers:

```bash
docker ps
```

You should see both the backend and MongoDB containers running.

---

## Managing Docker Containers

### Stop Containers

To stop the running containers:

```bash
docker-compose down
```

### Access a Running Container

If you need to access the shell inside a running container (e.g., the backend container):

```bash
docker exec -it <container_name_or_id> /bin/bash
```

### Check Logs

You can check the logs of a specific container (e.g., backend):

```bash
docker-compose logs backend
```

---

## Testing the API

Once the server is up and running, you can test the API using tools like **Postman** or **cURL**.

**Example API Requests:**

- Get all courses:  
  `GET http://localhost:5000/api/courses`

- Create a new course:  
  `POST http://localhost:5000/api/courses`  
  **Body (JSON):**
  ```json
  {
    "course_name": "Yoga for Beginners",
    "details": "An introductory yoga class for beginners.",
    "price": 1500,
    "total_sessions": 10,
    "cancellation_policy": "Refundable within 24 hours notice.",
    "user_id": "teacher_id_here"
  }
  ```

---

## Frequently Asked Questions

### 1. Error: `MODULE_NOT_FOUND`

If the Docker container reports a missing module error, ensure that you have installed all dependencies by running `npm install` and that Docker is correctly configured to install dependencies inside the container.

### 2. MongoDB Connection Issues

If the backend cannot connect to MongoDB, verify that the MongoDB container is running and accessible at the correct port by checking the logs using:

```bash
docker-compose logs mongo
```

---

## Setting Environment Variables

The project uses environment variables for configuration, such as the MongoDB URI and JWT secret. You can set these values in the `.env` file.

Example `.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mydatabase?retryWrites=true&w=majority
JWT_SECRET=mysecretkey
```
