import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { AppError } from '../../plugins/errors.js';
import { mlProxy } from '../ml-proxy/service.js';

export async function shopRoutes(fastify: FastifyInstance) {
  // GET /shops
  fastify.get('/', async (request, reply) => {
    const querySchema = z.object({
      area: z.string().optional(),
      type: z.enum(['small', 'department']).optional(),
    });

    const { area, type } = querySchema.parse(request.query);

    const where: any = {};
    if (area) where.area = { contains: area };
    if (type) where.type = type;

    const shops = await prisma.shop.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    return {
      shops: shops.map((s) => ({
        ...s,
        categories: JSON.parse(s.categories || '[]'),
      })),
    };
  });

  // GET /shops/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        offers: {
          include: { product: true },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shop) {
      throw new AppError(404, 'SHOP_NOT_FOUND', `Shop with id '${id}' was not found.`, 'Verify the shop ID from the Nearby Map.');
    }

    return {
      shop: {
        ...shop,
        categories: JSON.parse(shop.categories || '[]'),
      },
    };
  });

  // GET /shops/:id/reviews
  fastify.get('/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };
    const reviews = await prisma.review.findMany({
      where: { shopId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { reviews };
  });

  // GET /shops/:id/crowd (Proxies ML service with fallback)
  fastify.get('/:id/crowd', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const crowd = await mlProxy.getCrowd(id);
      return crowd;
    } catch (err) {
      // Graceful fallback for TRL 3 evaluation
      return {
        peopleNow: 24,
        level: 'moderate',
        queues: [
          { counterId: 'Counter 1', length: 2, waitMins: 3.0 },
        ],
        meta: { model: 'simulated-baseline', version: '1.0', source: 'synthetic', stale: true },
      };
    }
  });

  // GET /shops/:id/best-time
  fastify.get('/:id/best-time', async (request, reply) => {
    const { id } = request.params as { id: string };
    const today = new Date().toISOString().split('T')[0];

    try {
      const footfall = await mlProxy.getFootfallByHour(id, today);
      return { hours: footfall };
    } catch (err) {
      // Default Pollachi diurnal curve
      const baseCurve = [
        0, 0, 0, 0, 0, 0, 0, 8, 18, 42, 58, 62, 34, 22, 19, 28, 40, 65, 84, 92, 78, 35, 12, 0,
      ];
      return { hours: baseCurve, meta: { source: 'baseline', synthetic: true } };
    }
  });
}
