import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { setupErrorHandler } from './plugins/errors.js';

import { authRoutes } from './modules/auth/routes.js';
import { shopRoutes } from './modules/shops/routes.js';
import { catalogueRoutes } from './modules/catalogue/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { ownerRoutes } from './modules/owner/routes.js';
import { healthRoutes } from './modules/health/routes.js';
import { adminRoutes } from './modules/admin/routes.js';

export function buildApp() {
  const fastify = Fastify({
    logger: config.NODE_ENV === 'test' ? false : true,
    disableRequestLogging: config.NODE_ENV === 'test',
  });

  // 1. Plugins
  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
  });

  fastify.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // 2. OpenAPI / Swagger Documentation
  fastify.register(swagger, {
    openapi: {
      info: {
        title: 'LocalKart v3 Core API',
        description: 'Hyperlocal Commerce and Store Intelligence Engine for Pollachi, Tamil Nadu (TRL 3)',
        version: '3.0.0',
      },
      servers: [
        {
          url: 'http://localhost:4000/api/v1',
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  fastify.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 3. Error Handler
  setupErrorHandler(fastify);

  // 4. API Routes under /api/v1 prefix
  fastify.register(
    async (api) => {
      api.register(authRoutes, { prefix: '/auth' });
      api.register(shopRoutes, { prefix: '/shops' });
      api.register(catalogueRoutes);
      api.register(orderRoutes);
      api.register(ownerRoutes, { prefix: '/owner' });
      api.register(adminRoutes, { prefix: '/admin' });
      api.register(healthRoutes);
    },
    { prefix: '/api/v1' }
  );

  return fastify;
}
