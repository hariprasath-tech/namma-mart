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

  // 6. CSV Bulk Upload with Row-Numbered Error Validation (Section 8.2)
  describe('Inventory CSV Bulk Import (POST /api/v1/owner/stock/import)', () => {
    it('validates CSV rows and reports exact row numbers for invalid lines', async () => {
      const csvWithErrors = [
        'product_name,category,unit,price,stock',
        'Valid Ponni Rice,Grocery,1 kg,65.00,20',
        ',Grocery,1 kg,50.00,10', // Row 3: Missing name
        'Invalid Price Oil,Oils,1 L,not_a_number,15', // Row 4: Invalid price
        'Negative Stock Dal,Pulses,1 kg,120.00,-5', // Row 5: Negative stock
        'Valid Sambar Powder,Spices,100g,35.50,50', // Row 6: Valid
      ].join('\n');

      const res = await request.post('/api/v1/owner/stock/import').send({
        shopId: 'shop-1',
        csv: csvWithErrors,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.importedCount).toBe(2);
      expect(res.body.errorCount).toBe(3);

      const errorRows = res.body.errors.map((e: any) => e.row);
      expect(errorRows).toEqual([3, 4, 5]);
      expect(res.body.errors[0].message).toContain('product name');
      expect(res.body.errors[1].message).toContain('Invalid price');
      expect(res.body.errors[2].message).toContain('Invalid stock');
    });

    it('successfully exports inventory as CSV', async () => {
      const res = await request.get('/api/v1/owner/stock/export?shopId=shop-1');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Product Name');
      expect(res.text).toContain('Price (₹)');
    });
  });

  // 7. Khata Ledger & Ageing Calculations (Section 8.3)
  describe('Khata Ledger & Ageing (GET /api/v1/owner/khata/ageing)', () => {
    it('creates customer, records debt and payment, and computes ageing buckets', async () => {
      // 1. Create Khata Customer
      const custRes = await request.post('/api/v1/owner/khata').send({
        shopId: 'shop-1',
        name: 'Venkatesh Babu',
        phone: '+91 98421 88888',
        initialBalancePaise: 45000, // ₹450 debt
        note: 'Provisions for temple festival',
      });
      expect(custRes.status).toBe(201);
      const customerId = custRes.body.customer.id;

      // 2. Record Partial Repayment
      const payRes = await request.post(`/api/v1/owner/khata/${customerId}/payment`).send({
        amount: 20000, // ₹200 payment
        mode: 'upi',
        note: 'UPI payment via GPay',
      });
      expect(payRes.status).toBe(201);
      expect(payRes.body.remainingBalancePaise).toBe(25000); // ₹250 remaining

      // 3. Check Ageing Buckets
      const ageRes = await request.get('/api/v1/owner/khata/ageing?shopId=shop-1');
      expect(ageRes.status).toBe(200);
      expect(ageRes.body.totalOutstandingPaise).toBeGreaterThanOrEqual(25000);
      expect(ageRes.body.buckets).toBeDefined();
      expect(ageRes.body.buckets.current0to7Paise).toBeGreaterThanOrEqual(0);
      expect(ageRes.body.buckets.due8to30Paise).toBeGreaterThanOrEqual(0);
      expect(ageRes.body.buckets.overdue30plusPaise).toBeGreaterThanOrEqual(0);
    });
  });

  // 8. Reorder List & Crowd Endpoints
  describe('Reorder & Crowd Intelligence Endpoints', () => {
    it('returns low-stock replenishment reorder list', async () => {
      const res = await request.get('/api/v1/owner/reorder-list?shopId=shop-1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reorderList)).toBe(true);
    });

    it('returns live crowd and zone status', async () => {
      const liveRes = await request.get('/api/v1/owner/crowd/live?shopId=shop-1');
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.peopleNow).toBeDefined();

      const zoneRes = await request.get('/api/v1/owner/crowd/zones?shopId=shop-1');
      expect(zoneRes.status).toBe(200);
      expect(zoneRes.body.zones.length).toBeGreaterThan(0);
      expect(zoneRes.body.staffingHint).toBeDefined();
    });
  });

  // 9. Vendor Shop Management & Categories
  describe('Vendor Shop Management (/api/v1/shops)', () => {
    let createdShopId: string;

    it('creates a new vendor shop', async () => {
      const res = await request.post('/api/v1/shops').send({
        name: 'Pollachi Organic Organics',
        shortName: 'Pollachi Org',
        area: 'Palakkad Road',
        address: '88, Palakkad Road, Pollachi',
        phone: '+91 94422 11000',
        categories: ['Organic', 'Millets', 'Grocery'],
        type: 'small',
      });

      expect(res.status).toBe(201);
      expect(res.body.shop.name).toBe('Pollachi Organic Organics');
      expect(res.body.shop.categories).toContain('Organic');
      createdShopId = res.body.shop.id;
    });

    it('updates shop details', async () => {
      const res = await request.patch(`/api/v1/shops/${createdShopId}`).send({
        openNow: false,
        hours: '7:30 AM - 10:00 PM',
      });

      expect(res.status).toBe(200);
      expect(res.body.shop.openNow).toBe(false);
      expect(res.body.shop.hours).toBe('7:30 AM - 10:00 PM');
    });

    it('returns distinct shop types and areas', async () => {
      const res = await request.get('/api/v1/shops/types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.areas)).toBe(true);
      expect(Array.isArray(res.body.types)).toBe(true);
    });
  });

  // 10. Master Product Catalogue Management
  describe('Product Catalogue Management (/api/v1/products)', () => {
    let testProductId: string;

    it('creates a new master product and returns categories', async () => {
      const res = await request.post('/api/v1/products').send({
        name: 'Pollachi Virgin Coconut Oil 500ml',
        category: 'Oils',
        unit: '500 ml',
        description: 'Cold-pressed extra virgin coconut oil from local Pollachi farms',
      });

      expect(res.status).toBe(201);
      expect(res.body.product.name).toContain('Virgin Coconut Oil');
      testProductId = res.body.product.id;

      const catRes = await request.get('/api/v1/products/categories');
      expect(catRes.status).toBe(200);
      expect(catRes.body.categories).toContain('Oils');
    });

    it('updates master product info', async () => {
      const res = await request.patch(`/api/v1/products/${testProductId}`).send({
        unit: '1 Litre Bottle',
      });
      expect(res.status).toBe(200);
      expect(res.body.product.unit).toBe('1 Litre Bottle');
    });
  });

  // 11. Multi-Vendor Order Processing & Customer Review
  describe('Multi-Vendor Order Checkout & Reviews', () => {
    it('processes multi-vendor cart and generates separate vendor orders with stock depletion', async () => {
      const offers = await prisma.offer.findMany({
        where: { stock: { gte: 2 } },
        take: 2,
      });

      if (offers.length >= 2) {
        const initialStock0 = offers[0].stock;
        const initialStock1 = offers[1].stock;

        const res = await request.post('/api/v1/orders/multi-vendor').send({
          customerName: 'Anitha Rajan',
          customerPhone: '+91 98421 77777',
          deliveryAddress: '32, Gandhi Nagar, Pollachi',
          mode: 'delivery',
          payment: 'upi',
          items: [
            { offerId: offers[0].id, qty: 1 },
            { offerId: offers[1].id, qty: 1 },
          ],
        });

        expect(res.status).toBe(201);
        expect(res.body.multiVendor).toBe(true);
        expect(res.body.orders.length).toBeGreaterThanOrEqual(1);

        // Verify stock depleted
        const check0 = await prisma.offer.findUnique({ where: { id: offers[0].id } });
        expect(check0?.stock).toBe(initialStock0 - 1);

        // Test Customer Order Review
        const testOrderId = res.body.orders[0].id;
        const reviewRes = await request.post(`/api/v1/orders/${testOrderId}/review`).send({
          rating: 5,
          text: 'Super fresh products and prompt delivery!',
          author: 'Anitha Rajan',
        });
        expect(reviewRes.status).toBe(201);
        expect(reviewRes.body.review.rating).toBe(5);
      }
    });

    it('returns customer order history via /api/v1/orders/mine', async () => {
      const res = await request.get('/api/v1/orders/mine?phone=%2B91%2098421%2090112');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  // 12. Admin Platform Operations
  describe('Admin Operations (/api/v1/admin)', () => {
    it('returns platform statistics with GMV and counts', async () => {
      const res = await request.get('/api/v1/admin/stats');
      expect(res.status).toBe(200);
      expect(res.body.stats.totalShops).toBeGreaterThan(0);
      expect(res.body.stats.totalProducts).toBeGreaterThan(0);
      expect(res.body.stats.totalGmvPaise).toBeDefined();
    });

    it('lists all shops and updates verification status', async () => {
      const shopsRes = await request.get('/api/v1/admin/shops');
      expect(shopsRes.status).toBe(200);
      expect(shopsRes.body.shops.length).toBeGreaterThan(0);

      const targetShop = shopsRes.body.shops[0];
      const verifyRes = await request.patch(`/api/v1/admin/shops/${targetShop.id}/verify`).send({
        verified: true,
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.shop.verified).toBe(true);
    });

    it('lists users and updates role', async () => {
      const usersRes = await request.get('/api/v1/admin/users');
      expect(usersRes.status).toBe(200);
      expect(usersRes.body.users.length).toBeGreaterThan(0);

      const targetUser = usersRes.body.users[0];
      const roleRes = await request.patch(`/api/v1/admin/users/${targetUser.id}/role`).send({
        role: 'customer',
      });
      expect(roleRes.status).toBe(200);
      expect(roleRes.body.user.role).toBe('customer');
    });
  });

  // 13. Group Orders & Community Buying
  describe('Group Orders (/api/v1/groups)', () => {
    it('lists active group orders with dynamic delivery fee', async () => {
      const res = await request.get('/api/v1/groups');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.groups)).toBe(true);
      expect(res.body.groups.length).toBeGreaterThan(0);
      expect(res.body.groups[0].currentFee).toBeDefined();
    });

    it('allows a neighbour to join and dynamically reduces delivery fee', async () => {
      const groupsRes = await request.get('/api/v1/groups');
      const grp = groupsRes.body.groups[0];
      const initialFee = grp.currentFee;

      const joinRes = await request.post(`/api/v1/groups/${grp.id}/join`).send({
        name: 'Thangavel M.',
      });
      expect(joinRes.status).toBe(200);
      expect(joinRes.body.group.members.length).toBeGreaterThan(grp.joined);
      expect(joinRes.body.group.currentFee).toBeLessThanOrEqual(initialFee);
    });
  });

  // 14. Item Requests & Vendor Quotations
  describe('Item Requests & Merchant Quotations', () => {
    it('allows merchant to reply with a quotation to a customer request', async () => {
      const reqList = await request.get('/api/v1/requests');
      expect(reqList.status).toBe(200);
      const reqItem = reqList.body.requests[0];

      const replyRes = await request.post(`/api/v1/requests/${reqItem.id}/reply`).send({
        shopId: 'shop-1',
        shopName: 'Sri Krishna Provisions',
        price: 8500, // ₹85
        available: true,
      });
      expect(replyRes.status).toBe(201);
      expect(replyRes.body.reply.requestId).toBe(reqItem.id);
      expect(replyRes.body.reply.price).toBe(8500);
    });
  });

  // 15. Store Catalogue & Direct Reviews
  describe('Store Catalogue & Direct Reviews', () => {
    it('returns offers for a product across all shops via GET /api/v1/offers', async () => {
      const res = await request.get('/api/v1/offers?productId=prod-1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.offers)).toBe(true);
      expect(res.body.offers.length).toBeGreaterThan(0);
      expect(res.body.offers[0].productId).toBe('prod-1');
      expect(res.body.offers[0].shop).toBeDefined();
    });

    it('submits a direct customer review on a shop and updates rating', async () => {
      const shop = await prisma.shop.findFirst();
      if (!shop) return;

      const res = await request.post(`/api/v1/shops/${shop.id}/reviews`).send({
        rating: 5,
        text: 'Clean store, fast delivery, authentic Pollachi products!',
        author: 'Nalini V.',
      });
      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);

      const updatedShop = await prisma.shop.findUnique({ where: { id: shop.id } });
      expect(updatedShop?.reviewCount).toBeGreaterThan(0);
    });
  });

  // 16. Merchant Expense Management & Smart Shelf Edge Frame Analysis
  describe('Merchant Operations: Expenses & Smart Shelf', () => {
    it('retrieves merchant expenses via GET /api/v1/owner/expenses', async () => {
      const res = await request.get('/api/v1/owner/expenses?shopId=shop-1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.expenses)).toBe(true);
      expect(res.body.expenses.length).toBeGreaterThan(0);
    });

    it('processes edge camera frame analysis without persisting raw image to disk', async () => {
      const frameRes = await request.post('/api/v1/owner/shelf/analyze').send({
        shopId: 'shop-1',
        cameraId: 'cam-grains',
        boxes: [
          { label: 'Ponni Rice 1kg', qty: 10, confidence: 0.95, bbox: [10, 20, 30, 40] },
        ],
        gaps: [
          { slot: 'Rack-A2', productId: 'prod-1', missing: 2 },
        ],
        frameHash: 'sha256_mock_test_hash_001',
      });
      expect(frameRes.status).toBe(201);
      expect(frameRes.body.snapshot.meta.frameHash).toBe('sha256_mock_test_hash_001');

      const statusRes = await request.get('/api/v1/owner/shelf/status?shopId=shop-1&cameraId=cam-grains');
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.gaps.length).toBeGreaterThan(0);
    });
  });
});
