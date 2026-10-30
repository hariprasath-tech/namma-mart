import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('localkart_super_secret_jwt_key_pollachi_2026_tr3'),
  JWT_REFRESH_SECRET: z.string().default('localkart_super_secret_refresh_key_pollachi_2026_tr3'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000/ml/v1'),
  SEED: z.string().default('localkart_pollachi_v2'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
});

export const config = envSchema.parse(process.env);
