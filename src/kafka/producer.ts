import { Kafka } from "kafkajs";

interface IKafkaMessage {
  postActivityUrn: string;
  parentCommentUrn: string;
  replyText: string;
}

export async function createProducer(kafkaMessage: IKafkaMessage) {
  const kafka = new Kafka({
    clientId: "node-ts-producer",
    brokers: ["localhost:9092"], // Ensure Kafka container port is mapped
  });

  const producer = kafka.producer();

  console.log("🔌 Connecting producer...");
  await producer.connect();
  console.log("✅ Producer connected");

  const result = await producer.send({
    topic: "linkedin-comment-replies",
    messages: [
      {
        value: JSON.stringify(kafkaMessage),
      },
    ],
  });

  console.log("📤 Message sent:", result);
  await producer.disconnect();
}
