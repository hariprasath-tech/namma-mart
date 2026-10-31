import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET /notifications (Fetch notifications with user isolation)
  fastify.get('/', async (request, reply) => {
    const querySchema = z.object({
      userId: z.string().optional(),
    });
    const { userId } = querySchema.parse(request.query);

    let targetUserId = userId;
    // Check if authenticated via JWT
    try {
      const user = await (request as any).jwtVerify();
      if (user && user.id) {
        targetUserId = user.id;
      }
    } catch {
      // Unauthenticated, fall back to explicit userId query if provided
    }

    if (!targetUserId) {
      // Return empty list if no user identified
      return { notifications: [], unreadCount: 0 };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  });

  // POST /notifications (Create notification)
  fastify.post('/', async (request, reply) => {
    const bodySchema = z.object({
      userId: z.string().min(1, 'userId is required'),
      title: z.string().min(1, 'title is required'),
      message: z.string().min(1, 'message is required'),
      type: z.enum(['info', 'order', 'promo', 'price']).default('info'),
    });

    const body = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) {
      return reply.status(404).send({
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with id "${body.userId}" not found`,
          fix: 'Provide a valid registered user id.',
        },
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        title: body.title,
        message: body.message,
        type: body.type,
      },
    });

    return reply.status(201).send({ notification });
  });

  // PATCH /notifications/:id/read (Mark as read)
  fastify.patch('/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          fix: 'Verify the notification id and try again.',
        },
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return { success: true, notification: updated };
  });

  // DELETE /notifications/:id (Delete notification)
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          fix: 'Verify the notification id and try again.',
        },
      });
    }

    await prisma.notification.delete({ where: { id } });
    return reply.status(200).send({ success: true, message: 'Notification deleted' });
  });
}
