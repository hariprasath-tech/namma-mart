import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './errors.js';

export interface TokenUser {
  userId: string;
  phone: string;
  role: 'customer' | 'owner' | 'staff' | 'admin';
  shopId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token missing or invalid.', 'Please log in with your phone number to proceed.');
    }
    const token = authHeader.split(' ')[1];
    const decoded = await request.server.jwt.verify<TokenUser>(token);
    request.user = decoded;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'INVALID_TOKEN', 'Session expired or token invalid.', 'Please log in again to renew your access.');
  }
}

export function authorizeRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied. Role '${request.user?.role}' is not authorized for this resource.`,
        'Log in with an account having merchant or administrator privileges.'
      );
    }
  };
}

export function authorizeShopOwner() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (!request.user || (request.user.role !== 'owner' && request.user.role !== 'admin')) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Merchant access required.',
        'This portal is reserved for registered shop owners in Pollachi.'
      );
    }
  };
}
