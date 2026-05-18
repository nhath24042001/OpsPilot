export const OPSPILOT_EVENTS_EXCHANGE = 'opspilot.events';

export const QUEUES = {
  websocketBroadcast: 'q.websocket.broadcast',
  documentExtract: 'q.document.extract',
} as const;

export const ROUTING_KEYS = {
  incidentAll: 'incident.*',
  documentUploaded: 'document.uploaded',
} as const;
