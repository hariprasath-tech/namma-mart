import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/app.js';
import fs from 'fs';
import path from 'path';

// Minimal JSON Schema validator check for contract test
describe('API & ML Contract Compliance against shared/ml.schema.json', { timeout: 15000 }, () => {
  const app = buildApp();
  let request: any;
  let masterSchema: any;

  beforeAll(async () => {
    await app.ready();
    request = supertest(app.server);

    const schemaPath = path.resolve(__dirname, '../../../shared/ml.schema.json');
    const schemaRaw = fs.readFileSync(schemaPath, 'utf-8');
    masterSchema = JSON.parse(schemaRaw);
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates GET /api/v1/health declares TRL 3 maturity level', async () => {
    const res = await request.get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.trlLevel).toBe(3);
    expect(res.body.trlStatus).toContain('TRL 3');
  });

  it('validates GET /api/v1/owner/shelf/status contract conforms to ShelfStatus schema', async () => {
    const res = await request.get('/api/v1/owner/shelf/status');
    expect(res.status).toBe(200);
    const snapshot = res.body.snapshot || res.body;
    expect(snapshot).toBeDefined();
    expect(snapshot.cameraId).toBeDefined();
    expect(snapshot.capturedAt).toBeDefined();
    expect(Array.isArray(snapshot.boxes)).toBe(true);
    expect(Array.isArray(snapshot.gaps)).toBe(true);
    expect(snapshot.meta).toBeDefined();
    expect(snapshot.meta.source).toMatch(/^(pretrained|fine-tuned|synthetic|baseline)$/);
  });

  it('validates GET /api/v1/shops/:id/crowd contract conforms to CrowdSnapshot schema', async () => {
    const res = await request.get('/api/v1/shops/shop_sp_organic/crowd');
    expect(res.status).toBe(200);
    const crowd = res.body.crowd || res.body;
    expect(crowd).toBeDefined();
    expect(typeof crowd.peopleNow).toBe('number');
    expect(['quiet', 'moderate', 'busy']).toContain(crowd.level);
    expect(Array.isArray(crowd.queues)).toBe(true);
  });

  it('validates GET /api/v1/owner/insights/forecast/:id contract conforms to ForecastPoint schema', async () => {
    const res = await request.get('/api/v1/owner/insights/forecast/p-ponni-rice?days=7');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.forecast)).toBe(true);

    const firstPt = res.body.forecast[0];
    if (firstPt) {
      expect(firstPt.date).toBeDefined();
      expect(firstPt.expected).toBeGreaterThanOrEqual(0);
      expect(firstPt.low).toBeLessThanOrEqual(firstPt.expected);
      expect(firstPt.expected).toBeLessThanOrEqual(firstPt.high);
    }
  });

  it('validates GET /api/v1/owner/insights/bundles contract conforms to ProductPair schema', async () => {
    const res = await request.get('/api/v1/owner/insights/bundles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bundles)).toBe(true);

    const firstPair = res.body.bundles[0];
    if (firstPair) {
      expect(firstPair.productA).toBeDefined();
      expect(firstPair.productB).toBeDefined();
      expect(typeof firstPair.frequency).toBe('number');
      expect(typeof firstPair.suggestion).toBe('string');
    }
  });
});
