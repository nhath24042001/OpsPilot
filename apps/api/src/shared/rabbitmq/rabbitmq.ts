import amqp from 'amqplib';
import { env } from '../config/env.js';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;

export const getRabbitMqConnection = async (): Promise<AmqpConnection> => {
  if (connection) {
    try {
      const ch = await connection.createChannel();
      await ch.close();
      return connection;
    } catch {
      connection = null;
    }
  }
  connection = await amqp.connect(env.RABBITMQ_URL);
  return connection;
};

export const checkRabbitMq = async (): Promise<boolean> => {
  try {
    const conn = await getRabbitMqConnection();
    const channel = await conn.createChannel();
    await channel.close();
    return true;
  } catch {
    return false;
  }
};

export const closeRabbitMq = async (): Promise<void> => {
  if (connection) {
    const conn = connection;
    connection = null;
    await conn.close();
  }
};

