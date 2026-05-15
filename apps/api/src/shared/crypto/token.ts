import crypto from 'node:crypto';

export const createOpaqueToken = () => crypto.randomBytes(32).toString('base64url');

export const hashOpaqueToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const addMinutes = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};
