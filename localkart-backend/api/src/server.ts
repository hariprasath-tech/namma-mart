import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`🚀 LocalKart Core API listening on http://${config.HOST}:${config.PORT}/api/v1`);
    console.log(`📚 OpenAPI / Swagger documentation: http://${config.HOST}:${config.PORT}/api/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
