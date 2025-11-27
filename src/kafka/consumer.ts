import { Kafka } from 'kafkajs';

async function createConsumer() {
  const kafka = new Kafka({
    clientId: 'node-ts-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({ groupId: 'ts-group' });

  console.log('🔌 Connecting consumer...');
  await consumer.connect();
  console.log('✅ Consumer connected');

  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`📩 Received: ${message.value?.toString()}`);
    },
  });
}

// createConsumer().catch((err) => {
//   console.error('❌ Error in consumer:', err);
// });
