import crypto from 'node:crypto';
import { env } from '../../../shared/config/env.js';
import { domainError } from '../../../shared/errors/app-error.js';
import type { OAuthProviderName } from '../domain/value-objects/oauth-provider.vo.js';


type OAuthStatePayload = {
  provider: OAuthProviderName;
  nonce: string;
  exp: number;
};

const encode = (value: string) => Buffer.from(value).toString('base64url');
const decode = (value: string) => Buffer.from(value, 'base64url').toString();

const sign = (payload: string) =>
  crypto.createHmac('sha256', env.OAUTH_STATE_SECRET).update(payload).digest('base64url');

export const oauthStateService = {
  create(provider: OAuthProviderName) {
    const payload: OAuthStatePayload = {
      provider,
      nonce: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 10 * 60,
    };

    const encodedPayload = encode(JSON.stringify(payload));
    const signature = sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  },

  verify(state: string, expectedProvider: OAuthProviderName) {
    const [encodedPayload, signature] = state.split('.');

    if (!encodedPayload || !signature) {
      throw domainError('AUTH_OAUTH_INVALID_STATE');
    }

    const expectedSignature = sign(encodedPayload);
    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      throw domainError('AUTH_OAUTH_INVALID_STATE');
    }

    let payload: OAuthStatePayload;
    try {
      payload = JSON.parse(decode(encodedPayload)) as OAuthStatePayload;
    } catch {
      throw domainError('AUTH_OAUTH_INVALID_STATE');
    }

    if (payload.provider !== expectedProvider || payload.exp < Math.floor(Date.now() / 1000)) {
      throw domainError('AUTH_OAUTH_INVALID_STATE');
    }

    return payload;
  },
};
