#!/usr/bin/env node

/**
 * Performance Test Script
 * Measures load times and performance metrics
 */

import { loadConfig } from '../dist/index.js';

const ITERATIONS = 1000;

async function runPerformanceTests() {
  console.log('🚀 Performance Test Suite\n');
  console.log('='.repeat(60));
  console.log(`\nRunning ${ITERATIONS} iterations for each test...\n`);

  // Test 1: Basic load performance
  console.log('📦 Test 1: Basic Configuration Load');
  const start1 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    await loadConfig({
      name: 'test-app',
      env: 'test',
    });
  }
  const end1 = performance.now();
  const avg1 = ((end1 - start1) / ITERATIONS).toFixed(3);
  console.log(`   Average load time: ${avg1}ms`);
  console.log(`   Total time: ${((end1 - start1) / 1000).toFixed(2)}s`);

  // Test 2: Get operation performance
  console.log('\n🔍 Test 2: Get Operation');
  const config = await loadConfig({
    name: 'test-app',
    env: 'test',
  });
  const start2 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    config.get('test.value', 'default');
  }
  const end2 = performance.now();
  const avg2 = ((end2 - start2) / ITERATIONS).toFixed(3);
  console.log(`   Average get time: ${avg2}ms`);

  // Test 3: Has operation performance
  console.log('\n✅ Test 3: Has Operation');
  const start3 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    config.has('test.value');
  }
  const end3 = performance.now();
  const avg3 = ((end3 - start3) / ITERATIONS).toFixed(3);
  console.log(`   Average has time: ${avg3}ms`);

  // Test 4: Memory usage
  console.log('\n💾 Test 4: Memory Usage');
  const memUsage = process.memoryUsage();
  console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);

  // Performance recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Performance Analysis:');

  if (parseFloat(avg1) < 5) {
    console.log('✅ Load time is excellent (< 5ms)');
  } else if (parseFloat(avg1) < 10) {
    console.log('⚠️  Load time is good but could be improved (< 10ms)');
  } else {
    console.log('❌ Load time exceeds 10ms - optimization needed');
  }

  if (parseFloat(avg2) < 0.1) {
    console.log('✅ Get operation is very fast (< 0.1ms)');
  } else if (parseFloat(avg2) < 0.5) {
    console.log('✅ Get operation is fast (< 0.5ms)');
  } else {
    console.log('⚠️  Get operation could be faster');
  }

  console.log('\n🎯 Optimization Tips:');
  console.log('  - Use caching for frequently accessed values');
  console.log('  - Consider lazy loading for optional features');
  console.log('  - Monitor memory usage in production');

  console.log('\n✨ Performance test complete!\n');
}

runPerformanceTests().catch(console.error);
