import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { AppError } from '../../plugins/errors.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /admin/stats
  fastify.get('/stats', async () => {
    const [userCount, shopCount, productCount, orderCount, paidOrders] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: { paymentStatus: 'paid' },
        select: { totalAmount: true },
      }),
    ]);

    const totalGmvPaise = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    return {
      stats: {
        totalUsers: userCount,
        totalShops: shopCount,
        totalProducts: productCount,
        totalOrders: orderCount,
        totalGmvPaise,
        totalGmvRupees: (totalGmvPaise / 100).toFixed(2),
        platformStatus: 'operational',
      },
    };
  });

  // GET /admin/shops
  fastify.get('/shops', async () => {
    const shops = await prisma.shop.findMany({
      include: {
        _count: {
          select: { offers: true, orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      shops: shops.map((s) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        area: s.area,
        phone: s.phone,
        type: s.type,
        verified: s.verified,
        rating: s.rating,
        reviewCount: s.reviewCount,
        offerCount: s._count.offers,
        orderCount: s._count.orders,
        createdAt: s.createdAt,
      })),
    };
  });

  // PATCH /admin/shops/:id/verify
  fastify.patch('/shops/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      verified: z.boolean(),
    });

    const { verified } = schema.parse(request.body);

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'SHOP_NOT_FOUND', `Shop #${id} not found`, 'Check shop ID');
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: { verified },
    });

    return { shop: updated };
  });

  // GET /admin/users
  fastify.get('/users', async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { users };
  });

  // PATCH /admin/users/:id/role
  fastify.patch('/users/:id/role', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      role: z.enum(['customer', 'owner', 'staff', 'admin']),
    });

    const { role } = schema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', `User #${id} not found`, 'Check user ID');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, phone: true, role: true },
    });

    return { user: updated };
  });
}
