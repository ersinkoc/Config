#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Analyzes and reports bundle sizes for the project
 */

import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const distDir = './dist';
const files = [
  'index.js',
  'index.cjs',
  'index.d.ts',
  'index.d.cts',
  'plugins/index.js',
  'plugins/index.cjs',
  'plugins/index.d.ts',
  'plugins/index.d.cts',
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('📊 Bundle Size Analysis\n');
  console.log('='.repeat(60));

  let totalSize = 0;
  const results = [];

  for (const file of files) {
    try {
      const filePath = join(distDir, file);
      const stats = statSync(filePath);
      const size = stats.size;
      totalSize += size;

      results.push({
        file,
        size,
        formatted: formatBytes(size),
      });

      console.log(`\n📄 ${file}`);
      console.log(`   Size: ${formatBytes(size)}`);
    } catch (error) {
      console.log(`\n⚠️  ${file} - File not found`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n💾 Total Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`\n📈 Breakdown by Type:`);

  // Group by type
  const types = {
    JavaScript: results.filter(r => r.file.endsWith('.js') || r.file.endsWith('.cjs')),
    TypeScript: results.filter(r => r.file.endsWith('.d.ts') || r.file.endsWith('.d.cts')),
  };

  for (const [type, files] of Object.entries(types)) {
    const typeTotal = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`\n   ${type}: ${formatBytes(typeTotal)}`);
    files.forEach(file => {
      console.log(`      - ${file.file}: ${file.formatted}`);
    });
  }

  // Performance recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Performance Recommendations:');

  if (totalSize > 100 * 1024) {
    console.log('⚠️  Bundle size exceeds 100KB. Consider:');
    console.log('   - Lazy loading for optional features');
    console.log('   - Further code splitting');
  } else {
    console.log('✅ Bundle size is optimal (< 100KB)');
  }

  if (results.some(r => r.file.includes('index.js') && r.size > 50 * 1024)) {
    console.log('\n⚠️  Main bundle exceeds 50KB. Consider:');
    console.log('   - Removing unused code (dead code elimination)');
    console.log('   - Using dynamic imports for heavy features');
  }

  console.log('\n✨ Analysis complete!\n');
}

analyzeBundle();
