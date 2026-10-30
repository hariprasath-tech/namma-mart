import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up
    { duration: '40s', target: 50 },  // 50 virtual users sustained
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<120'], // 95% of requests must complete under 120ms
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  // 1. Search products
  const searchRes = http.get(`${BASE_URL}/search?q=rice&lat=10.6609&lng=77.0048`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => JSON.parse(r.body).resultsCount > 0,
  });

  sleep(0.5);

  // 2. Compare multi-shop offers
  const compareRes = http.get(`${BASE_URL}/compare/p-ponni-rice?lat=10.6609&lng=77.0048`);
  check(compareRes, {
    'compare status is 200': (r) => r.status === 200,
    'compare returns ranked offers': (r) => JSON.parse(r.body).rankedOffers.length > 0,
  });

  sleep(1);
}
