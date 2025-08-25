#!/usr/bin/env node

/**
 * Bundle size analysis script
 * Measures bundle size before and after lazy loading improvements
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '.svelte-kit/output/client/_app/immutable';
const RESULTS_FILE = 'bundle-analysis.json';

function getBundleStats() {
  const stats = {
    timestamp: new Date().toISOString(),
    totalSize: 0,
    chunkCount: 0,
    largestChunks: [],
    totalGzipSize: 0
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('Build output not found. Run `pnpm build` first.');
    return stats;
  }

  // Get all JS files from the build output
  const getAllJSFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(getAllJSFiles(fullPath));
      } else if (item.endsWith('.js')) {
        const size = stat.size;
        files.push({
          name: path.relative(OUTPUT_DIR, fullPath),
          size: size,
          sizeKB: Math.round(size / 1024 * 100) / 100
        });
        stats.totalSize += size;
        stats.chunkCount++;
      }
    }
    
    return files;
  };

  const files = getAllJSFiles(OUTPUT_DIR);
  
  // Find largest chunks
  stats.largestChunks = files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Calculate total size in KB and MB
  stats.totalSizeKB = Math.round(stats.totalSize / 1024 * 100) / 100;
  stats.totalSizeMB = Math.round(stats.totalSize / (1024 * 1024) * 100) / 100;

  return stats;
}

function saveResults(stats, phase) {
  let results = {};
  
  if (fs.existsSync(RESULTS_FILE)) {
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  }
  
  results[phase] = stats;
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

function printStats(stats, phase) {
  console.log(`\n📊 Bundle Analysis - ${phase}`);
  console.log('='.repeat(50));
  console.log(`Total Size: ${stats.totalSizeMB} MB (${stats.totalSizeKB} KB)`);
  console.log(`Total Chunks: ${stats.chunkCount}`);
  console.log('\n🔝 Largest Chunks:');
  
  stats.largestChunks.forEach((chunk, index) => {
    console.log(`${index + 1}. ${chunk.name} - ${chunk.sizeKB} KB`);
  });
}

function compareResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log('No previous results to compare with.');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  
  if (results.before && results.after) {
    const sizeDiff = results.after.totalSizeKB - results.before.totalSizeKB;
    const chunkDiff = results.after.chunkCount - results.before.chunkCount;
    const percentChange = ((sizeDiff / results.before.totalSizeKB) * 100).toFixed(2);
    
    console.log('\n📈 Bundle Size Comparison');
    console.log('='.repeat(50));
    console.log(`Before: ${results.before.totalSizeKB} KB`);
    console.log(`After:  ${results.after.totalSizeKB} KB`);
    console.log(`Change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(2)} KB (${percentChange}%)`);
    console.log(`Chunks: ${results.before.chunkCount} → ${results.after.chunkCount} (${chunkDiff > 0 ? '+' : ''}${chunkDiff})`);
    
    if (sizeDiff < 0) {
      console.log('✅ Bundle size reduced!');
    } else if (sizeDiff > 0) {
      console.log('⚠️  Bundle size increased.');
    } else {
      console.log('➡️  Bundle size unchanged.');
    }
  }
}

// Main execution
const command = process.argv[2] || 'analyze';

switch (command) {
  case 'before':
    console.log('📦 Building for baseline measurement...');
    execSync('pnpm build', { stdio: 'inherit' });
    const beforeStats = getBundleStats();
    printStats(beforeStats, 'BEFORE Lazy Loading');
    saveResults(beforeStats, 'before');
    break;
    
  case 'after':
    console.log('📦 Building for comparison measurement...');
    execSync('pnpm build', { stdio: 'inherit' });
    const afterStats = getBundleStats();
    printStats(afterStats, 'AFTER Lazy Loading');
    saveResults(afterStats, 'after');
    compareResults();
    break;
    
  case 'compare':
    compareResults();
    break;
    
  default:
    console.log('📦 Building current version...');
    execSync('pnpm build', { stdio: 'inherit' });
    const currentStats = getBundleStats();
    printStats(currentStats, 'CURRENT');
    break;
}