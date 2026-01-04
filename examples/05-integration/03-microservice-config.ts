/**
 * Example 18: Microservice Configuration
 *
 * This example demonstrates configuration for a microservice architecture.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  const config = await loadConfig({
    name: 'user-service',
    env: process.env.NODE_ENV || 'development',
    paths: [
      './config.yaml',
      './services/shared.yaml',
    ],
    mergeStrategy: {
      default: 'merge',
      arrays: 'unique',
    },
  });

  // Service configuration
  const serviceConfig = {
    name: config.get('service.name'),
    version: config.get('service.version'),
    port: config.get('service.port'),
    host: config.get('service.host'),
  };

  // Database configuration
  const dbConfig = {
    host: config.get('database.host'),
    port: config.get('database.port'),
    name: config.get('database.name'),
    credentials: {
      username: config.get('database.username'),
      password: config.get('database.password'),
    },
  };

  // Redis configuration
  const redisConfig = {
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    cluster: config.get('redis.cluster', false),
  };

  // Message queue configuration
  const mqConfig = {
    url: config.get('messageQueue.url'),
    exchange: config.get('messageQueue.exchange'),
  };

  console.log('Service Config:', serviceConfig);
  console.log('Database Config:', dbConfig);
  console.log('Redis Config:', redisConfig);
  console.log('Message Queue Config:', mqConfig);

  // Watch for configuration changes
  config.watch();
  console.log('Configuration watching enabled');
}

main().catch(console.error);
