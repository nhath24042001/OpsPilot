export const OPSPILOT_EVENTS_EXCHANGE = 'opspilot.events';

export const QUEUES = {
  websocketBroadcast: 'q.websocket.broadcast',
} as const;

export const ROUTING_KEYS = {
  incidentAll: 'incident.*',
} as const;
