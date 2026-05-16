import type { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../errors/app-error.js';
import { verifyAccessToken } from './jwt.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    next(unauthorized());
  }
};

