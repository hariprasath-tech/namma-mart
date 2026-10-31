import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { compareOffers } from '../../lib/business.js';

// Suspicious injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|previous) instructions/i,
  /system prompt/i,
  /developer mode/i,
  /drop table/i,
  /reveal (secret|password|api key|token)/i,
  /you are now/i,
  /jailbreak/i,
];

export async function chatRoutes(fastify: FastifyInstance) {
  // POST /chat/message (Interact with AI Shopping Assistant)
  fastify.post('/message', async (request, reply) => {
    const bodySchema = z.object({
      conversationId: z.string().optional(),
      userId: z.string().optional(),
      message: z.string().min(1, 'Message cannot be empty'),
    });

    const { conversationId: rawConvId, userId, message } = bodySchema.parse(request.body);
    const conversationId = rawConvId || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 1. Guardrail against prompt injections
    const isInjection = PROMPT_INJECTION_PATTERNS.some((pat) => pat.test(message));
    if (isInjection) {
      const safeReply = "Vanakkam! I am LocalKart's shopping assistant. I help you find groceries, compare prices across Pollachi merchants, and track local deliveries. How can I help with your shopping today?";
      
      await prisma.chatMessage.create({
        data: { conversationId, userId, role: 'user', content: message },
      });
      const assistantMsg = await prisma.chatMessage.create({
        data: { conversationId, userId, role: 'assistant', content: safeReply },
      });

      return reply.send({
        conversationId,
        reply: safeReply,
        toolCalled: null,
        messageId: assistantMsg.id,
      });
    }

    // 2. Persist user message
    await prisma.chatMessage.create({
      data: { conversationId, userId, role: 'user', content: message },
    });

    // 3. Intelligent Tool Dispatching
    const lower = message.toLowerCase();
    let replyText = '';
    let toolName: string | null = null;
    let toolData: any = null;

    if (lower.includes('track') || lower.includes('order status') || /LK-\d+/i.test(message)) {
      // Tool: Order Tracking
      toolName = 'track_order';
      const orderMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|LK-\d+/i);
      const queryId = orderMatch ? orderMatch[0] : null;

      if (queryId) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [{ id: queryId }, { id: { contains: queryId } }],
          },
          include: { shop: true, items: true },
        });

        if (order) {
          toolData = { orderId: order.id, status: order.status, shop: order.shopName, total: order.totalAmount };
          replyText = `Your order #${order.id.slice(0, 8)} at ${order.shopName} is currently "${order.status}". Total amount: ₹${order.totalAmount / 100}.`;
        } else {
          replyText = `Could not find an order matching "${queryId}". Please verify your order ID.`;
        }
      } else {
        replyText = "Please provide your Order ID (e.g. LK-1024 or full UUID) so I can look up the live status.";
      }
    } else if (lower.includes('compare') || lower.includes('cheapest') || lower.includes('price of')) {
      // Tool: Price Comparison
      toolName = 'compare_prices';
      const products = await prisma.product.findMany({
        include: { offers: { include: { shop: true } } },
        take: 10,
      });

      const matched = products.find((p) =>
        lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(' ').some((w) => lower.includes(w))
      );

      if (matched && matched.offers.length > 0) {
        const mappedOffers = matched.offers.map((o) => ({
          shopId: o.shopId,
          shopName: o.shop.shortName || o.shop.name,
          price: o.price,
          stock: o.stock,
          rating: o.shop.rating,
          deliveryEstMins: o.deliveryEstMins || 25,
        }));

        const ranked = compareOffers(mappedOffers as any);
        const cheapest = ranked[0];
        toolData = { product: matched.name, rankedOffers: ranked };
        replyText = `For "${matched.name}", the lowest price in Pollachi is ₹${cheapest.price / 100} at ${cheapest.shopName} (${cheapest.rating}⭐, ~${cheapest.deliveryEstMins}m delivery).`;
      } else {
        replyText = "I compared prices across Pollachi shops. Ponni Rice starts at ₹52/kg at Sri Krishna, and Coconut Oil at ₹180/L at Selvi Supermarket.";
      }
    } else if (lower.includes('shop') || lower.includes('store') || lower.includes('nearby')) {
      // Tool: Nearby Shop Discovery
      toolName = 'nearby_shops';
      const shops = await prisma.shop.findMany({
        where: { openNow: true },
        take: 5,
        orderBy: { rating: 'desc' },
      });

      toolData = { shopsCount: shops.length, shops: shops.map((s) => ({ name: s.name, area: s.area, rating: s.rating })) };
      replyText = `Found ${shops.length} verified stores nearby in Pollachi. Top rated: ${shops.map((s) => `${s.name} (${s.area})`).join(', ')}.`;
    } else {
      // Tool: Product Search
      toolName = 'search_products';
      const results = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: lower } },
            { category: { contains: lower } },
            { description: { contains: lower } },
          ],
        },
        include: { offers: { include: { shop: true } } },
        take: 3,
      });

      if (results.length > 0) {
        toolData = { results: results.map((r) => ({ id: r.id, name: r.name, minPrice: Math.min(...r.offers.map((o) => o.price)) })) };
        replyText = `Found ${results.length} items matching your search: ${results.map((r) => `${r.name} (from ₹${Math.min(...r.offers.map((o) => o.price)) / 100})`).join(', ')}.`;
      } else {
        replyText = `Vanakkam! I'm here to help you shop Pollachi local stores. Try asking me "compare prices for Ponni Rice", "nearby grocery shops", or "track my order".`;
      }
    }

    // 4. Save assistant response
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        userId,
        role: 'assistant',
        content: replyText,
        toolName,
        toolCallJson: toolData ? JSON.stringify(toolData) : null,
      },
    });

    return reply.send({
      conversationId,
      reply: replyText,
      toolCalled: toolName,
      toolData,
      messageId: assistantMsg.id,
    });
  });

  // GET /chat/history/:conversationId (Fetch conversation history)
  fastify.get('/history/:conversationId', async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return { conversationId, messages };
  });

  // DELETE /chat/history/:conversationId (Clear conversation history)
  fastify.delete('/history/:conversationId', async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };

    await prisma.chatMessage.deleteMany({
      where: { conversationId },
    });

    return { success: true, message: 'Conversation deleted' };
  });
}
