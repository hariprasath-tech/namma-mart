import { FastifyInstance } from 'fastify';
import { prisma } from '../../db.js';
import { mlProxy } from '../ml-proxy/service.js';

export async function healthRoutes(fastify: FastifyInstance) {
  // GET /health
  fastify.get('/health', async (request, reply) => {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'disconnected';
    }

    return {
      status: 'healthy',
      trlLevel: 3,
      trl: 'TRL 3',
      trlStatus: 'TRL 3 - Analytical and experimental critical function proof of concept',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  // GET /ready
  fastify.get('/ready', async (request, reply) => {
    return { ready: true };
  });

  // GET /version
  fastify.get('/version', async (request, reply) => {
    return {
      name: 'localkart-core-api',
      version: '3.0.0',
      trl: 'TRL 3',
      description: 'Experimental Hyperlocal Commerce Platform for Pollachi, Tamil Nadu',
      environment: process.env.NODE_ENV || 'development',
      circuitBreaker: mlProxy.getCircuitStatus(),
    };
  });
}
