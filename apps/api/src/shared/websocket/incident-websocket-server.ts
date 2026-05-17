import type { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { verifyAccessToken } from '../auth/jwt.js';
import { logger } from '../logger/logger.js';
import { accessControlModule } from '../../modules/access-control/access-control.module.js';
import type { OutboxPublishMessage } from '../outbox/outbox-event.js';

type ClientState = {
  userId: string;
  rooms: Set<string>;
};

const clientState = new WeakMap<WebSocket, ClientState>();

let websocketServer: WebSocketServer | null = null;

const roomKey = (organizationId: string, incidentId: string) =>
  `org:${organizationId}:incident:${incidentId}`;

const isSubscribeMessage = (
  value: unknown,
): value is { type: 'incident.subscribe'; organizationId: string; incidentId: string } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate['type'] === 'incident.subscribe' &&
    typeof candidate['organizationId'] === 'string' &&
    typeof candidate['incidentId'] === 'string'
  );
};

const parseToken = (url: string | undefined): string | null => {
  if (!url) {
    return null;
  }

  const parsed = new URL(url, 'http://localhost');
  return parsed.searchParams.get('token');
};

const rawDataToString = (raw: RawData): string => {
  if (typeof raw === 'string') {
    return raw;
  }

  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8');
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString('utf8');
  }

  return Buffer.from(raw).toString('utf8');
};

export const attachIncidentWebSocketServer = (server: HttpServer): WebSocketServer => {
  websocketServer = new WebSocketServer({ server, path: '/ws' });

  websocketServer.on('connection', (socket, request) => {
    try {
      const token = parseToken(request.url);
      if (!token) {
        socket.close(1008, 'Missing token');
        return;
      }

      const payload = verifyAccessToken(token);
      clientState.set(socket, { userId: payload.sub, rooms: new Set() });

      socket.on('message', (raw) => {
        void (async () => {
          try {
            const parsed = JSON.parse(rawDataToString(raw)) as unknown;
            if (!isSubscribeMessage(parsed)) {
              socket.send(JSON.stringify({ type: 'error', message: 'Unsupported message' }));
              return;
            }

            const state = clientState.get(socket);
            if (!state) {
              socket.close(1008, 'Unauthorized');
              return;
            }

            await accessControlModule.permissionService.ensurePermission({
              organizationId: parsed.organizationId,
              userId: state.userId,
              permission: 'incident:read',
            });

            state.rooms.add(roomKey(parsed.organizationId, parsed.incidentId));
            socket.send(
              JSON.stringify({
                type: 'incident.subscribed',
                organizationId: parsed.organizationId,
                incidentId: parsed.incidentId,
              }),
            );
          } catch (error) {
            logger.warn({ err: error }, 'WebSocket subscribe failed');
            socket.close(1008, 'Forbidden');
          }
        })();
      });
    } catch (error) {
      logger.warn({ err: error }, 'WebSocket authentication failed');
      socket.close(1008, 'Unauthorized');
    }
  });

  return websocketServer;
};

export const broadcastIncidentEvent = (message: OutboxPublishMessage): void => {
  if (!websocketServer || !message.organizationId) {
    return;
  }

  const payload = message.payload;
  const incidentId =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)['incidentId']
      : null;

  if (typeof incidentId !== 'string') {
    return;
  }

  const targetRoom = roomKey(message.organizationId, incidentId);
  const outbound = JSON.stringify({
    type: message.eventType,
    message,
  });

  for (const client of websocketServer.clients) {
    const state = clientState.get(client);
    if (client.readyState === WebSocket.OPEN && state?.rooms.has(targetRoom)) {
      client.send(outbound);
    }
  }
};

export const closeIncidentWebSocketServer = async (): Promise<void> => {
  const server = websocketServer;
  websocketServer = null;

  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};
