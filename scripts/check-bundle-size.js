#!/usr/bin/env node

/**
 * Bundle Size Limit Checker
 * Ensures bundle sizes don't exceed specified limits
 */

import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const distDir = './dist';

// Size limits in bytes
const LIMITS = {
  'index.js': 60 * 1024,      // 60KB
  'index.cjs': 60 * 1024,     // 60KB
  'plugins/index.js': 40 * 1024, // 40KB
  'plugins/index.cjs': 40 * 1024, // 40KB
  TOTAL: 200 * 1024,          // 200KB total
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkBundleSize() {
  console.log('🔍 Checking Bundle Sizes Against Limits\n');
  console.log('='.repeat(60));

  let totalSize = 0;
  let hasErrors = false;

  // Check individual files
  for (const [file, limit] of Object.entries(LIMITS)) {
    if (file === 'TOTAL') continue;

    try {
      const filePath = join(distDir, file);
      const stats = statSync(filePath);
      const size = stats.size;
      totalSize += size;

      const percentage = ((size / limit) * 100).toFixed(1);
      const isWithinLimit = size <= limit;

      console.log(`\n📄 ${file}:`);
      console.log(`   Size: ${formatBytes(size)} / ${formatBytes(limit)} (${percentage}%)`);

      if (isWithinLimit) {
        console.log(`   ✅ Within limit`);
      } else {
        console.log(`   ❌ Exceeds limit by ${formatBytes(size - limit)}`);
        hasErrors = true;
      }
    } catch (error) {
      console.log(`\n⚠️  ${file} - File not found`);
    }
  }

  // Check total size
  console.log('\n' + '='.repeat(60));
  const totalPercentage = ((totalSize / LIMITS.TOTAL) * 100).toFixed(1);
  const isTotalWithinLimit = totalSize <= LIMITS.TOTAL;

  console.log(`\n💾 Total Bundle Size:`);
  console.log(`   Size: ${formatBytes(totalSize)} / ${formatBytes(LIMITS.TOTAL)} (${totalPercentage}%)`);

  if (isTotalWithinLimit) {
    console.log(`   ✅ Within total limit`);
  } else {
    console.log(`   ❌ Exceeds total limit by ${formatBytes(totalSize - LIMITS.TOTAL)}`);
    hasErrors = true;
  }

  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.log('\n❌ Bundle size check FAILED\n');
    console.log('To fix this:');
    console.log('  1. Review and remove unused code');
    console.log('  2. Consider lazy loading for optional features');
    console.log('  3. Use dynamic imports for heavy features');
    console.log('  4. Update limits if they are too restrictive\n');
    process.exit(1);
  } else {
    console.log('\n✅ All bundle sizes are within limits!\n');
    process.exit(0);
  }
}

checkBundleSize();
