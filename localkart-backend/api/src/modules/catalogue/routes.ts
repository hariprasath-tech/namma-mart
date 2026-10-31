import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { AppError } from '../../plugins/errors.js';
import { compareOffers, optimizeBasket } from '../../lib/business.js';

export async function catalogueRoutes(fastify: FastifyInstance) {
  // GET /products
  fastify.get('/products', async (request, reply) => {
    const querySchema = z.object({
      category: z.string().optional(),
    });
    const { category } = querySchema.parse(request.query);

    const where: any = {};
    if (category && category !== 'All') where.category = category;

    const products = await prisma.product.findMany({ where });
    return { products };
  });

  // GET /offers?productId=&shopId=
  fastify.get('/offers', async (request, reply) => {
    const querySchema = z.object({
      productId: z.string().optional(),
      shopId: z.string().optional(),
    });

    const { productId, shopId } = querySchema.parse(request.query);
    const where: any = {};
    if (productId) where.productId = productId;
    if (shopId) where.shopId = shopId;

    const offers = await prisma.offer.findMany({
      where,
      include: {
        product: true,
        shop: true,
      },
      orderBy: { price: 'asc' },
    });

    return { offers };
  });

  // GET /products/:id
  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        offers: {
          include: { shop: true },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with id '${id}' not found.`, 'Search for another grocery item or browse categories.');
    }

    return { product };
  });

  // GET /search?q=&area=&lat=&lng=&sort=
  fastify.get('/search', async (request, reply) => {
    const searchSchema = z.object({
      q: z.string().optional(),
      area: z.string().optional(),
      lat: z.coerce.number().default(10.6609),
      lng: z.coerce.number().default(77.0048),
      category: z.string().optional(),
    });

    const { q, area, lat, lng, category } = searchSchema.parse(request.query);

    const productWhere: any = {};
    if (q) {
      productWhere.OR = [
        { name: { contains: q } },
        { nameTa: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (category && category !== 'All') {
      productWhere.category = category;
    }

    const matchedProducts = await prisma.product.findMany({
      where: productWhere,
      include: {
        offers: {
          include: { shop: true },
        },
      },
    });

    // Check if zero stock for logging
    const totalOffers = matchedProducts.reduce((acc, p) => acc + p.offers.length, 0);
    const isZeroStock = totalOffers === 0;

    // Log search event asynchronously for Lost Demand analytics
    if (q) {
      prisma.searchLog.create({
        data: {
          query: q,
          area: area || 'Pollachi',
          resultCount: totalOffers,
          zeroStock: isZeroStock,
        },
      }).catch((e) => fastify.log.warn('Could not save search log:', e));
    }

    return {
      query: q || '',
      resultsCount: matchedProducts.length,
      products: matchedProducts,
    };
  });

  // GET /compare/:productId?lat=&lng=&filters=
  fastify.get('/compare/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const querySchema = z.object({
      lat: z.coerce.number().default(10.6609),
      lng: z.coerce.number().default(77.0048),
      maxDistanceMetres: z.coerce.number().optional(),
      minRating: z.coerce.number().optional(),
      openNowOnly: z.coerce.boolean().optional(),
      hasDeliveryOnly: z.coerce.boolean().optional(),
      hasPickupOnly: z.coerce.boolean().optional(),
      sortBy: z.enum(['cheapest', 'closest', 'topRated']).optional(),
    });

    const query = querySchema.parse(request.query);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        offers: {
          include: { shop: true },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Cannot compare offers for non-existent product.', 'Pick a valid item from the store catalog.');
    }

    const ranked = compareOffers(
      product.offers.map((o) => ({
        id: o.id,
        price: o.price,
        stock: o.stock,
        shop: {
          id: o.shop.id,
          name: o.shop.name,
          lat: o.shop.lat,
          lng: o.shop.lng,
          rating: o.shop.rating,
          openNow: o.shop.openNow,
          delivery: o.shop.delivery,
          pickup: o.shop.pickup,
        },
      })),
      { lat: query.lat, lng: query.lng },
      {
        maxDistanceMetres: query.maxDistanceMetres,
        minRating: query.minRating,
        openNowOnly: query.openNowOnly,
        hasDeliveryOnly: query.hasDeliveryOnly,
        hasPickupOnly: query.hasPickupOnly,
        sortBy: query.sortBy,
      }
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
      },
      rankedOffers: ranked,
    };
  });

  // POST /basket/optimize
  fastify.post('/basket/optimize', async (request, reply) => {
    const bodySchema = z.object({
      list: z.array(
        z.object({
          productId: z.string(),
          qty: z.number().int().min(1),
        })
      ),
      baseDeliveryFee: z.number().int().default(2000), // Default 2000 paise = ₹20
    });

    const { list, baseDeliveryFee } = bodySchema.parse(request.body);

    const productIds = list.map((item) => item.productId);
    const offers = await prisma.offer.findMany({
      where: {
        productId: { in: productIds },
        stock: { gt: 0 },
      },
      include: { shop: true },
    });

    const storeOfferItems = offers.map((o) => ({
      productId: o.productId,
      shopId: o.shopId,
      shopName: o.shop.shortName || o.shop.name,
      price: o.price,
    }));

    const result = optimizeBasket(list, storeOfferItems, baseDeliveryFee);
    return result;
  });

  // GET /products/categories (Distinct categories)
  fastify.get('/products/categories', async () => {
    const products = await prisma.product.findMany({ select: { category: true } });
    const categories = ['All', ...new Set(products.map((p) => p.category))];
    return { categories };
  });

  // POST /products (Add Master Product)
  fastify.post('/products', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      nameTa: z.string().optional(),
      category: z.string().min(2),
      unit: z.string().default('1 kg'),
      image: z.string().url().default('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'),
      description: z.string().default('Fresh product from local Pollachi vendor'),
      descriptionTa: z.string().optional(),
    });

    const body = schema.parse(request.body);

    const product = await prisma.product.create({
      data: body,
    });

    return reply.status(201).send({ product });
  });

  // PATCH /products/:id (Update Master Product)
  fastify.patch('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(2).optional(),
      nameTa: z.string().optional(),
      category: z.string().min(2).optional(),
      unit: z.string().optional(),
      image: z.string().url().optional(),
      description: z.string().optional(),
      descriptionTa: z.string().optional(),
    });

    const body = schema.parse(request.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product #${id} not found`, 'Check product ID');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: body,
    });

    return { product: updated };
  });
}

