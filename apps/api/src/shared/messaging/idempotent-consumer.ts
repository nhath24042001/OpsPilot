import type { OutboxPublishMessage } from '../outbox/outbox-event.js';
import type { ProcessedMessageRepository } from './processed-message.repository.js';

type Handler = (message: OutboxPublishMessage) => Promise<void>;

type Deps = {
  consumerName: string;
  processedMessageRepository: ProcessedMessageRepository;
  handler: Handler;
};

export const createIdempotentConsumer = (deps: Deps): Handler => {
  return async (message) => {
    const processedMessage = {
      messageId: message.messageId,
      consumerName: deps.consumerName,
    };
    const shouldProcess = await deps.processedMessageRepository.tryStart(processedMessage);

    if (!shouldProcess) {
      return;
    }

    try {
      await deps.handler(message);
    } catch (error) {
      await deps.processedMessageRepository.clear(processedMessage);
      throw error;
    }
  };
};
