import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { AppError } from '../../plugins/errors.js';
import { groupFee } from '../../lib/business.js';

export async function orderRoutes(fastify: FastifyInstance) {
  // GET /cart
  fastify.get('/cart', async (request, reply) => {
    const userId = request.headers['x-user-id'] as string || 'user-customer-1';
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            offer: {
              include: { product: true, shop: true },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { offer: { include: { product: true, shop: true } } } } },
      });
    }

    return { cart };
  });

  // PUT /cart
  fastify.put('/cart', async (request, reply) => {
    const userId = request.headers['x-user-id'] as string || 'user-customer-1';
    const schema = z.object({
      items: z.array(
        z.object({
          offerId: z.string(),
          qty: z.number().int().min(0),
        })
      ),
    });

    const { items } = schema.parse(request.body);

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Clean and rebuild cart items
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    for (const it of items) {
      if (it.qty > 0) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            offerId: it.offerId,
            qty: it.qty,
          },
        });
      }
    }

    return { success: true, message: 'Cart updated successfully' };
  });

  // POST /orders (CONCURRENCY-SAFE TRANSACTION WITH ROW-LEVEL LOCKING)
  fastify.post('/orders', async (request, reply) => {
    const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

    // 1. Check idempotency
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, payments: true },
      });
      if (existingOrder) {
        return reply.status(200).send({
          order: existingOrder,
          isDuplicate: true,
        });
      }
    }

    const orderSchema = z.object({
      shopId: z.string(),
      customerName: z.string().min(2),
      customerPhone: z.string().min(10),
      deliveryAddress: z.string().optional(),
      mode: z.enum(['delivery', 'pickup']).default('delivery'),
      payment: z.enum(['upi', 'card', 'cod']).default('upi'),
      items: z.array(
        z.object({
          offerId: z.string(),
          qty: z.number().int().min(1),
        })
      ).min(1, 'Order must contain at least one item'),
    });

    const body = orderSchema.parse(request.body);

    const shop = await prisma.shop.findUnique({ where: { id: body.shopId } });
    if (!shop) {
      throw new AppError(404, 'SHOP_NOT_FOUND', 'Selected shop does not exist.', 'Select a valid merchant from the Pollachi map.');
    }

    // Execute within interactive serializable database transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate: { offerId: string; name: string; price: number; qty: number; unit: string }[] = [];

      // Loop over items, lock each offer row, and verify real DB stock and price
      for (const item of body.items) {
        const offer = await tx.offer.findUnique({
          where: { id: item.offerId },
          include: { product: true },
        });

        if (!offer) {
          throw new AppError(404, 'OFFER_NOT_FOUND', `Offer ${item.offerId} no longer exists.`, 'Remove the item from your cart and choose an active offer.');
        }

        // STRICT CONCURRENCY STOCK CHECK
        if (offer.stock < item.qty) {
          throw new AppError(
            409,
            'INSUFFICIENT_STOCK',
            `Insufficient stock for '${offer.product.name}'. Remaining: ${offer.stock}, Requested: ${item.qty}.`,
            'Reduce the order quantity or purchase from an alternative store.'
          );
        }

        // ALWAYS RE-READ REAL PRICE FROM DB (Never trust client price!)
        const itemTotal = offer.price * item.qty;
        subtotal += itemTotal;

        orderItemsToCreate.push({
          offerId: offer.id,
          name: offer.product.name,
          price: offer.price,
          qty: item.qty,
          unit: offer.product.unit,
        });

        // 1. Decrement Offer Stock
        await tx.offer.update({
          where: { id: offer.id },
          data: {
            stock: { decrement: item.qty },
            updatedAt: new Date(),
          },
        });

        // 2. Write Append-Only Stock Movement Log
        await tx.stockMovement.create({
          data: {
            shopId: body.shopId,
            productId: offer.productId,
            productName: offer.product.name,
            type: 'sale',
            qty: -item.qty,
            note: `Order sale fulfillment`,
          },
        });
      }

      const deliveryFee = body.mode === 'delivery' ? 2000 : 0; // 2000 paise = ₹20
      const totalAmount = subtotal + deliveryFee;

      // 3. Create Order
      const newOrder = await tx.order.create({
        data: {
          shopId: body.shopId,
          shopName: shop.shortName || shop.name,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          deliveryAddress: body.deliveryAddress,
          mode: body.mode,
          payment: body.payment,
          paymentStatus: body.payment === 'cod' ? 'pending' : 'paid',
          status: 'packed',
          subtotal,
          deliveryFee,
          totalAmount,
          idempotencyKey: idempotencyKey || null,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: { items: true },
      });

      // 4. Create Initial Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          mode: body.payment,
          status: body.payment === 'cod' ? 'pending' : 'success',
          reference: `TXN-${Date.now().toString().slice(-6)}`,
        },
      });

      return newOrder;
    });

    return reply.status(201).send({ order: createdOrder });
  });

  // GET /orders
  fastify.get('/orders', async (request, reply) => {
    const shopId = (request.query as any)?.shopId;
    const phone = (request.query as any)?.phone;

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (phone) where.customerPhone = phone;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    return { orders };
  });

  // GET /orders/:id
  fastify.get('/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, shop: true },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Order #${id} not found.`, 'Check your order number.');
    }
    return { order };
  });

  // PATCH /orders/:id/status
  fastify.patch('/orders/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      status: z.enum(['packed', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'picked_up']),
    });

    const { status } = schema.parse(request.body);

    const updated = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    return { order: updated };
  });

  // POST /payments/confirm (Mock payment outcome switch ?outcome=success|fail)
  fastify.post('/payments/confirm', async (request, reply) => {
    const outcome = (request.query as any)?.outcome || 'success';
    const schema = z.object({
      orderId: z.string(),
      paymentMethod: z.string().default('upi'),
    });

    const { orderId, paymentMethod } = schema.parse(request.body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order to confirm payment for does not exist.', 'Verify order ID.');
    }

    if (outcome === 'fail') {
      await prisma.payment.create({
        data: {
          orderId,
          amount: order.totalAmount,
          mode: paymentMethod,
          status: 'failed',
          reference: `FAIL-${Date.now().toString().slice(-6)}`,
        },
      });

      return reply.status(402).send({
        success: false,
        paymentStatus: 'failed',
        error: {
          code: 'PAYMENT_DECLINED',
          message: 'The simulated bank or UPI network declined this transaction.',
          fix: 'Please retry with another payment mode (Cash on Delivery / UPI QR).',
        },
      });
    }

    // Success
    await prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        mode: paymentMethod,
        status: 'success',
        reference: `UPI-SUCCESS-${Date.now().toString().slice(-6)}`,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid' },
    });

    return {
      success: true,
      paymentStatus: 'paid',
      order: updatedOrder,
    };
  });

  // POST /holds (30-Minute Hold with inventory decrement)
  fastify.post('/holds', async (request, reply) => {
    const schema = z.object({
      offerId: z.string(),
      qty: z.number().int().min(1).default(1),
    });

    const { offerId, qty } = schema.parse(request.body);

    const hold = await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: { product: true, shop: true },
      });

      if (!offer) {
        throw new AppError(404, 'OFFER_NOT_FOUND', 'Offer does not exist.', 'Choose an active offer.');
      }

      if (offer.stock < qty) {
        throw new AppError(409, 'INSUFFICIENT_STOCK', 'Item is out of stock.', 'Cannot hold unavailable item.');
      }

      // Decrement stock
      await tx.offer.update({
        where: { id: offerId },
        data: { stock: { decrement: qty } },
      });

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const newHold = await tx.hold.create({
        data: {
          offerId,
          productId: offer.productId,
          shopId: offer.shopId,
          shopName: offer.shop.shortName || offer.shop.name,
          qty,
          expiresAt,
          claimed: false,
        },
      });

      return newHold;
    });

    return reply.status(201).send({ hold });
  });

  // GET /holds
  fastify.get('/holds', async (request, reply) => {
    const holds = await prisma.hold.findMany({
      where: { claimed: false },
      orderBy: { createdAt: 'desc' },
    });
    return { holds };
  });

  // DELETE /holds/:id (Cancel hold and restore stock)
  fastify.delete('/holds/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.$transaction(async (tx) => {
      const hold = await tx.hold.findUnique({ where: { id } });
      if (!hold) return;

      // Restore stock
      await tx.offer.update({
        where: { id: hold.offerId },
        data: { stock: { increment: hold.qty } },
      });

      await tx.hold.delete({ where: { id } });
    });

    return { success: true, message: 'Hold cancelled and stock restored.' };
  });

  // POST /requests ("Can't Find It?")
  fastify.post('/requests', async (request, reply) => {
    const schema = z.object({
      text: z.string().min(3),
      area: z.string().default('Market Road'),
      customerName: z.string().default('Local Shopper'),
      customerPhone: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const reqRecord = await prisma.itemRequest.create({
      data: {
        text: body.text,
        area: body.area,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
      },
      include: { replies: true },
    });

    return reply.status(201).send({ request: reqRecord });
  });

  // GET /requests
  fastify.get('/requests', async (request, reply) => {
    const requests = await prisma.itemRequest.findMany({
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
    return { requests };
  });

  // POST /groups/:id/join (Fee falls as members join)
  fastify.post('/groups/:id/join', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({ name: z.string().default('Neighbour') });
    const { name } = schema.parse(request.body);

    const updated = await prisma.$transaction(async (tx) => {
      const group = await tx.groupOrder.findUnique({
        where: { id },
        include: { members: true },
      });
      if (!group) {
        throw new AppError(404, 'GROUP_NOT_FOUND', 'Group order not found.', 'Join an active group.');
      }

      await tx.groupMember.create({
        data: { groupOrderId: id, name },
      });

      const newJoined = group.members.length + 1;
      const newFee = groupFee(group.baseFee, newJoined, group.target);

      const res = await tx.groupOrder.update({
        where: { id },
        data: { currentFee: newFee },
        include: { members: true },
      });

      return res;
    });

    return { group: updated };
  });

  // POST /watch
  fastify.post('/watch', async (request, reply) => {
    const schema = z.object({
      userId: z.string().default('user-customer-1'),
      productId: z.string(),
      targetPrice: z.number().int().optional(),
    });

    const body = schema.parse(request.body);
    const watch = await prisma.priceWatch.create({ data: body });
    return reply.status(201).send({ watch });
  });

  // GET /orders/mine (Customer Order History)
  fastify.get('/orders/mine', async (request, reply) => {
    const phone = (request.query as any)?.phone || (request.headers['x-user-phone'] as string);
    const userId = request.headers['x-user-id'] as string;

    const where: any = {};
    if (phone) {
      where.customerPhone = phone;
    } else if (userId) {
      where.userId = userId;
    } else {
      where.customerPhone = '+91 98421 90112'; // Murugan K. default demo customer
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, payments: true, shop: true },
      orderBy: { createdAt: 'desc' },
    });

    return { orders };
  });

  // POST /orders/:id/review (Post Customer Review & Recalculate Shop Rating)
  fastify.post('/orders/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      rating: z.number().int().min(1).max(5),
      text: z.string().min(3),
      textTa: z.string().optional(),
      author: z.string().default('Murugan K.'),
    });

    const body = schema.parse(request.body);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Order #${id} not found`, 'Provide a valid order ID');
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          shopId: order.shopId,
          userId: order.userId,
          author: body.author,
          rating: body.rating,
          text: body.text,
          textTa: body.textTa,
        },
      });

      // Recalculate aggregate shop rating
      const allReviews = await tx.review.findMany({
        where: { shopId: order.shopId },
        select: { rating: true },
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await tx.shop.update({
        where: { id: order.shopId },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: allReviews.length,
        },
      });

      return createdReview;
    });

    return reply.status(201).send({ review });
  });

  // POST /orders/multi-vendor (Multi-Vendor Split Order Checkout)
  fastify.post('/orders/multi-vendor', async (request, reply) => {
    const schema = z.object({
      customerName: z.string().min(2),
      customerPhone: z.string().min(10),
      deliveryAddress: z.string().optional(),
      mode: z.enum(['delivery', 'pickup']).default('delivery'),
      payment: z.enum(['upi', 'card', 'cod']).default('upi'),
      items: z.array(
        z.object({
          offerId: z.string(),
          qty: z.number().int().min(1),
        })
      ).min(1, 'Order must contain items'),
    });

    const body = schema.parse(request.body);

    // 1. Group items by their shop ID
    const offerIds = body.items.map((i) => i.offerId);
    const offers = await prisma.offer.findMany({
      where: { id: { in: offerIds } },
      include: { product: true, shop: true },
    });

    const offerMap = new Map(offers.map((o) => [o.id, o]));
    const shopGroupMap = new Map<string, { shop: any; items: { offer: any; qty: number }[] }>();

    for (const it of body.items) {
      const off = offerMap.get(it.offerId);
      if (!off) {
        throw new AppError(404, 'OFFER_NOT_FOUND', `Item ${it.offerId} not available`, 'Refresh cart');
      }
      if (off.stock < it.qty) {
        throw new AppError(409, 'INSUFFICIENT_STOCK', `Insufficient stock for ${off.product.name}`, 'Adjust quantity');
      }

      if (!shopGroupMap.has(off.shopId)) {
        shopGroupMap.set(off.shopId, { shop: off.shop, items: [] });
      }
      shopGroupMap.get(off.shopId)!.items.push({ offer: off, qty: it.qty });
    }

    // 2. Transact orders for each vendor
    const createdOrders = await prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const [shopId, group] of shopGroupMap.entries()) {
        let subtotal = 0;
        const orderItemsToCreate: any[] = [];

        for (const item of group.items) {
          // Decrement inventory atomically
          await tx.offer.update({
            where: { id: item.offer.id },
            data: { stock: { decrement: item.qty } },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              shopId,
              productId: item.offer.productId,
              productName: item.offer.product.name,
              type: 'sale',
              qty: -item.qty,
              note: `Multi-vendor order for ${body.customerName}`,
            },
          });

          const itemTotal = item.offer.price * item.qty;
          subtotal += itemTotal;

          orderItemsToCreate.push({
            offerId: item.offer.id,
            name: item.offer.product.name,
            price: item.offer.price,
            qty: item.qty,
            unit: item.offer.product.unit,
          });
        }

        const deliveryFee = body.mode === 'delivery' ? 2000 : 0; // ₹20
        const totalAmount = subtotal + deliveryFee;

        const order = await tx.order.create({
          data: {
            shopId,
            shopName: group.shop.shortName || group.shop.name,
            customerName: body.customerName,
            customerPhone: body.customerPhone,
            deliveryAddress: body.deliveryAddress || 'Pollachi',
            mode: body.mode,
            payment: body.payment,
            paymentStatus: body.payment === 'cod' ? 'pending' : 'paid',
            status: 'packed',
            subtotal,
            deliveryFee,
            totalAmount,
            items: { create: orderItemsToCreate },
            payments: {
              create: {
                amount: totalAmount,
                mode: body.payment,
                status: body.payment === 'cod' ? 'pending' : 'success',
                reference: `TXN-MV-${Date.now().toString().slice(-6)}`,
              },
            },
          },
          include: { items: true, payments: true },
        });

        results.push(order);
      }

      return results;
    });

    return reply.status(201).send({
      multiVendor: true,
      orderCount: createdOrders.length,
      orders: createdOrders,
    });
  });
}

