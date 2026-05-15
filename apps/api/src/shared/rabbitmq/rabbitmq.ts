import amqp from 'amqplib';
import { env } from '../config/env.js';

let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;

export const getRabbitMqConnection = async () => {
  connection ??= await amqp.connect(env.RABBITMQ_URL);
  return connection;
};

export const checkRabbitMq = async () => {
  try {
    const conn = await getRabbitMqConnection();
    const channel = await conn.createChannel();
    await channel.close();
    return true;
  } catch {
    return false;
  }
};

export const closeRabbitMq = async () => {
  if (connection) {
    await connection.close();
    connection = null;
  }
};
