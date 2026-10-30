import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/db.js';

describe('LocalKart v3 - API Integration Tests', () => {
  const app = buildApp();
  let request: any;

  beforeAll(async () => {
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // 1. Health & OpenAPI Verification
  describe('GET /api/v1/health & /version', () => {
    it('returns healthy status and TRL 3 classification', async () => {
      const res = await request.get('/api/v1/version');
      expect(res.status).toBe(200);
      expect(res.body.trl).toBe('TRL 3');
      expect(res.body.name).toBe('localkart-core-api');
    });
  });

  // 2. Authentication Flow
  describe('Authentication Flow (/api/v1/auth)', () => {
    const testPhone = `+91 9840${Math.floor(100000 + Math.random() * 900000)}`;

    it('registers a new customer account', async () => {
      const res = await request.post('/api/v1/auth/register').send({
        phone: testPhone,
        name: 'Kavitha Devi',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.phone).toBe(testPhone);
      expect(res.body.token).toBeDefined();
    });

    it('logs in successfully and returns JWT', async () => {
      const res = await request.post('/api/v1/auth/login').send({
        phone: testPhone,
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('returns standard error shape on incorrect credentials', async () => {
      const res = await request.post('/api/v1/auth/login').send({
        phone: testPhone,
        password: 'wrong_password',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.fix).toBeDefined();
    });
  });

  // 3. Search and Catalogue
  describe('GET /api/v1/search', () => {
    it('searches products and returns results with store offers', async () => {
      const res = await request.get('/api/v1/search?q=rice');
      expect(res.status).toBe(200);
      expect(res.body.resultsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.products[0].name.toLowerCase()).toContain('rice');
    });
  });

  // 4. Last-Unit Concurrency Race Test (Critical Viva Requirement)
  describe('Concurrency & Stock Integrity (POST /api/v1/orders)', () => {
    it('executes atomic row lock: parallel orders for last unit yield exactly one success', async () => {
      // 1. Setup an isolated test product with an offer having exactly 1 unit of stock
      const testShop = await prisma.shop.findFirst();
      if (!testShop) return;

      const raceProduct = await prisma.product.create({
        data: {
          name: 'Concurrency Test Grain ' + Date.now(),
          category: 'Groceries',
          unit: '1 kg',
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
          description: 'Test grain for concurrency verification',
        },
      });

      const raceOffer = await prisma.offer.create({
        data: {
          productId: raceProduct.id,
          shopId: testShop.id,
          price: 5000, // ₹50
          stock: 1, // EXACTLY 1 UNIT
        },
      });

      // 2. Fire two simultaneous order requests for this single unit
      const orderPayloadA = {
        shopId: testShop.id,
        customerName: 'Shopper Alpha',
        customerPhone: '+91 98421 11111',
        items: [{ offerId: raceOffer.id, qty: 1 }],
      };

      const orderPayloadB = {
        shopId: testShop.id,
        customerName: 'Shopper Beta',
        customerPhone: '+91 98421 22222',
        items: [{ offerId: raceOffer.id, qty: 1 }],
      };

      const [resA, resB] = await Promise.all([
        request.post('/api/v1/orders').send(orderPayloadA),
        request.post('/api/v1/orders').send(orderPayloadB),
      ]);

      // 3. Assert exactly one order succeeded with 201 and the other failed with 409
      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // 4. Verify remaining stock in DB is exactly 0
      const finalOffer = await prisma.offer.findUnique({ where: { id: raceOffer.id } });
      expect(finalOffer?.stock).toBe(0);

      // Clean up race test offer & product
      const successRes = resA.status === 201 ? resA : resB;
      const orderId = successRes.body?.order?.id;
      if (orderId) {
        await prisma.orderItem.deleteMany({ where: { orderId } });
        await prisma.payment.deleteMany({ where: { orderId } });
        await prisma.order.delete({ where: { id: orderId } });
      }
      await prisma.stockMovement.deleteMany({ where: { productId: raceProduct.id } });
      await prisma.offer.delete({ where: { id: raceOffer.id } });
      await prisma.product.delete({ where: { id: raceProduct.id } });
    });

    it('enforces idempotency key header: duplicate submissions return same order', async () => {
      const testShop = await prisma.shop.findFirst();
      if (!testShop) return;

      const idemProduct = await prisma.product.create({
        data: {
          name: 'Idempotency Test Grain ' + Date.now(),
          category: 'Groceries',
          unit: '1 kg',
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
          description: 'Test grain for idempotency verification',
        },
      });

      const testOffer = await prisma.offer.create({
        data: {
          productId: idemProduct.id,
          shopId: testShop.id,
          price: 3000,
          stock: 10,
        },
      });

      const key = `idem-key-${Date.now()}`;
      const payload = {
        shopId: testShop.id,
        customerName: 'Idempotency Tester',
        customerPhone: '+91 98421 33333',
        items: [{ offerId: testOffer.id, qty: 1 }],
      };

      const res1 = await request.post('/api/v1/orders').set('idempotency-key', key).send(payload);
      expect(res1.status).toBe(201);
      const orderId1 = res1.body.order.id;

      // Second identical request with same key
      const res2 = await request.post('/api/v1/orders').set('idempotency-key', key).send(payload);
      expect(res2.status).toBe(200);
      expect(res2.body.order.id).toBe(orderId1);
      expect(res2.body.isDuplicate).toBe(true);

      // Clean up
      await prisma.orderItem.deleteMany({ where: { offerId: testOffer.id } });
      await prisma.stockMovement.deleteMany({ where: { productId: idemProduct.id } });
      await prisma.payment.deleteMany({ where: { orderId: orderId1 } });
      await prisma.order.delete({ where: { id: orderId1 } });
      await prisma.offer.delete({ where: { id: testOffer.id } });
      await prisma.product.delete({ where: { id: idemProduct.id } });
    });
  });

  // 5. 30-Minute Hold Lifecycle
  describe('Hold Lifecycle (POST /api/v1/holds & DELETE)', () => {
    it('holds an item, decrements stock, and restores stock upon cancellation', async () => {
      const testOffer = await prisma.offer.findFirst();
      if (!testOffer) return;

      const initialStock = testOffer.stock;

      // 1. Create Hold
      const holdRes = await request.post('/api/v1/holds').send({
        offerId: testOffer.id,
        qty: 1,
      });
      expect(holdRes.status).toBe(201);
      const holdId = holdRes.body.hold.id;

      // Verify stock decremented
      const heldOffer = await prisma.offer.findUnique({ where: { id: testOffer.id } });
      expect(heldOffer?.stock).toBe(initialStock - 1);

      // 2. Cancel Hold
      const cancelRes = await request.delete(`/api/v1/holds/${holdId}`);
      expect(cancelRes.status).toBe(200);

      // Verify stock restored
      const restoredOffer = await prisma.offer.findUnique({ where: { id: testOffer.id } });
      expect(restoredOffer?.stock).toBe(initialStock);
    });
  });
});
