import { createClient } from "redis";
import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();

async function processRequest(request) {
  console.log(`Processing request: ${request}`);
  await producer.connect();
  await producer.send({
    topic: "request_logs",
    messages: [{ value: JSON.stringify(request) }],
  });
}

async function startWorker(userId) {
  setInterval(async () => {
    client.lpop(`queue_${userId}`, async (err, request) => {
      if (request) {
        await processRequest(JSON.parse(request));
      }
    });
  }, 1000);
}

async function main() {
  const userId = process.argv[2];
  await startWorker(userId);
}

client.connect().catch(console.error);
main().catch(console.error);
