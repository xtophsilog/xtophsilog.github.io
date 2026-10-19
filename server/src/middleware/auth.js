import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

function readUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** Attach req.user when a valid token is present, but never reject. */
export const optionalAuth = (req, _res, next) => {
  req.user = readUser(req);
  next();
};

export const requireAuth = (req, _res, next) => {
  req.user = readUser(req);
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  next();
};
