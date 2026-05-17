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
    const shouldProcess = await deps.processedMessageRepository.tryStart({
      messageId: message.messageId,
      consumerName: deps.consumerName,
    });

    if (!shouldProcess) {
      return;
    }

    await deps.handler(message);
  };
};
