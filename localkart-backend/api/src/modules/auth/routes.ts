import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db.js';
import { AppError } from '../../plugins/errors.js';
import { authenticate } from '../../plugins/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/register', async (request, reply) => {
    const schema = z.object({
      phone: z.string().min(10, 'Valid phone number required'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      role: z.enum(['customer', 'owner', 'staff', 'admin']).default('customer'),
    });

    const body = schema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) {
      throw new AppError(409, 'USER_EXISTS', 'An account with this phone number already exists.', 'Log in instead or use another mobile number.');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        phone: body.phone,
        name: body.name,
        role: body.role,
        passwordHash,
      },
    });

    const token = fastify.jwt.sign({ userId: user.id, phone: user.phone, role: user.role });
    return reply.status(201).send({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      token,
    });
  });

  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const schema = z.object({
      phone: z.string().min(10),
      password: z.string().min(1),
    });

    const { phone, password } = schema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'No account found with this phone number.', 'Check your phone number or register a new account.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect password.', 'Enter the correct password or reset via dev OTP.');
    }

    const token = fastify.jwt.sign({ userId: user.id, phone: user.phone, role: user.role });
    const refreshToken = fastify.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '7d' });

    return {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      token,
      refreshToken,
    };
  });

  // POST /auth/otp/request (Mock dev OTP)
  fastify.post('/otp/request', async (request, reply) => {
    const schema = z.object({ phone: z.string().min(10) });
    const { phone } = schema.parse(request.body);

    return {
      success: true,
      phone,
      message: 'OTP sent to mobile number. In development/testing, use fixed OTP: 123456',
    };
  });

  // POST /auth/otp/verify
  fastify.post('/otp/verify', async (request, reply) => {
    const schema = z.object({
      phone: z.string().min(10),
      otp: z.string(),
    });

    const { phone, otp } = schema.parse(request.body);

    // Mock OTP verification (fixed dev OTP)
    if (otp !== '123456') {
      throw new AppError(400, 'INVALID_OTP', 'The entered OTP code is incorrect.', 'Enter the dev verification code: 123456.');
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // Auto-register customer on first OTP login
      const defaultHash = await bcrypt.hash('localkart123', 10);
      user = await prisma.user.create({
        data: {
          phone,
          name: `Shopper ${phone.slice(-4)}`,
          role: 'customer',
          passwordHash: defaultHash,
        },
      });
    }

    const token = fastify.jwt.sign({ userId: user.id, phone: user.phone, role: user.role });
    return {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      token,
    };
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.', 'Please re-authenticate.');
    }
    return { user };
  });
}
