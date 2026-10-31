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

  // POST /shops/:id/reviews (Submit Customer Rating & Review)
  fastify.post('/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      rating: z.number().int().min(1).max(5),
      text: z.string().min(2),
      textTa: z.string().optional(),
      author: z.string().default('Pollachi Shopper'),
      userId: z.string().optional(),
      productId: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new AppError(404, 'SHOP_NOT_FOUND', `Shop #${id} not found`, 'Choose an active shop');
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          shopId: id,
          userId: body.userId,
          productId: body.productId,
          author: body.author,
          rating: body.rating,
          text: body.text,
          textTa: body.textTa,
        },
      });

      const allReviews = await tx.review.findMany({
        where: { shopId: id },
        select: { rating: true },
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await tx.shop.update({
        where: { id },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: allReviews.length,
        },
      });

      return createdReview;
    });

    return reply.status(201).send({ review });
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

  // GET /shops/types
  fastify.get('/types', async () => {
    const shops = await prisma.shop.findMany({ select: { area: true, type: true } });
    const areas = [...new Set(shops.map((s) => s.area))];
    const types = [...new Set(shops.map((s) => s.type))];
    return { areas, types };
  });

  // POST /shops (Vendor Store Registration)
  fastify.post('/', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(3),
      shortName: z.string().min(2).max(16),
      nameTa: z.string().optional(),
      area: z.string().min(2),
      address: z.string().min(5),
      phone: z.string().min(10),
      lat: z.number().default(10.6609),
      lng: z.number().default(77.0048),
      categories: z.array(z.string()).default(['Grocery']),
      bannerColor: z.string().default('#0E3B2C'),
      type: z.enum(['small', 'department']).default('small'),
      delivery: z.boolean().default(true),
      pickup: z.boolean().default(true),
    });

    const body = schema.parse(request.body);

    const shop = await prisma.shop.create({
      data: {
        name: body.name,
        shortName: body.shortName,
        nameTa: body.nameTa,
        area: body.area,
        address: body.address,
        phone: body.phone,
        lat: body.lat,
        lng: body.lng,
        categories: JSON.stringify(body.categories),
        bannerColor: body.bannerColor,
        type: body.type,
        delivery: body.delivery,
        pickup: body.pickup,
        verified: true,
      },
    });

    return reply.status(201).send({
      shop: {
        ...shop,
        categories: JSON.parse(shop.categories),
      },
    });
  });

  // PATCH /shops/:id (Update Shop Details)
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(3).optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      hours: z.string().optional(),
      openNow: z.boolean().optional(),
      delivery: z.boolean().optional(),
      pickup: z.boolean().optional(),
      categories: z.array(z.string()).optional(),
    });

    const body = schema.parse(request.body);
    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'SHOP_NOT_FOUND', `Shop #${id} not found`, 'Check shop ID');
    }

    const data: any = { ...body };
    if (body.categories) {
      data.categories = JSON.stringify(body.categories);
    }

    const updated = await prisma.shop.update({
      where: { id },
      data,
    });

    return {
      shop: {
        ...updated,
        categories: JSON.parse(updated.categories),
      },
    };
  });
}

