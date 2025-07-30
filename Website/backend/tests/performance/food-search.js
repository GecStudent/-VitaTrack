import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric for error rate
export const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{name:search}': ['p(95)<300'], // 95% of search requests should be below 300ms
    'http_req_duration{name:get_food}': ['p(95)<200'], // 95% of get food requests should be below 200ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Main test function
export default function() {
  // Search for foods
  const searchResponse = http.get(
    'http://localhost:3000/api/food/search?q=apple&limit=10',
    { tags: { name: 'search' } }
  );
  
  // Check if search was successful
  const searchCheck = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => {
      const body = JSON.parse(r.body);
      return body.results && body.results.foods && body.results.foods.length > 0;
    },
  });
  
  // Record errors
  errorRate.add(!searchCheck);
  
  // If search successful, get a food item
  if (searchCheck) {
    const body = JSON.parse(searchResponse.body);
    if (body.results.foods.length > 0) {
      const foodId = body.results.foods[0]._id;
      
      // Get food details
      const foodResponse = http.get(
        `http://localhost:3000/api/food/${foodId}`,
        { tags: { name: 'get_food' } }
      );
      
      // Check if get food was successful
      const foodCheck = check(foodResponse, {
        'get food status is 200': (r) => r.status === 200,
        'get food has data': (r) => {
          const body = JSON.parse(r.body);
          return body.name && body.nutrition_per_100g;
        },
      });
      
      // Record errors
      errorRate.add(!foodCheck);
    }
  }
  
  // Wait between iterations
  sleep(1);
}