#!/usr/bin/env node

/**
 * CI Guard: Detect Raw Supabase URLs
 * 
 * This script scans components for raw Supabase URLs that should be proxied
 * to prevent OpaqueResponseBlocking issues.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Files and patterns to check
const EXTENSIONS_TO_CHECK = ['.svelte', '.ts', '.js'];
const DIRECTORIES_TO_CHECK = ['src/components', 'src/routes', 'src/lib'];

// Patterns that indicate raw Supabase usage
const FORBIDDEN_PATTERNS = [
  // Direct signed URL usage in components
  /src\s*=\s*["'][^"']*\.supabase\.co/,
  /src\s*=\s*["'][^"']*\.supabase\.in/,
  /href\s*=\s*["'][^"']*\.supabase\.co/,
  /href\s*=\s*["'][^"']*\.supabase\.in/,
  
  // Template literals with Supabase URLs
  /src\s*=\s*`[^`]*\.supabase\.co/,
  /src\s*=\s*`[^`]*\.supabase\.in/,
  
  // Variable assignments with Supabase URLs (in components)
  /=\s*["'][^"']*\.supabase\.co[^"']*/,
  /=\s*["'][^"']*\.supabase\.in[^"']*/,
];

// Allowed patterns (exceptions)
const ALLOWED_PATTERNS = [
  // Configuration files and utilities are allowed
  /supabase\.ts$/,
  /supabase\.mock\.ts$/,
  /mediaProxy\.ts$/,
  /\+server\.ts$/, // API routes are allowed
];

function isFileAllowed(filePath) {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  if (isFileAllowed(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    FORBIDDEN_PATTERNS.forEach((pattern, patternIndex) => {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          pattern: pattern.toString(),
          message: 'Raw Supabase URL detected - should use proxy instead'
        });
      }
    });
  });

  return violations;
}

function scanDirectory(dirPath) {
  let violations = [];
  
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        violations = violations.concat(scanDirectory(fullPath));
      } else if (EXTENSIONS_TO_CHECK.includes(extname(item))) {
        violations = violations.concat(scanFile(fullPath));
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
  }
  
  return violations;
}

function main() {
  console.log('🔍 Scanning for raw Supabase URLs in components...');
  
  let allViolations = [];
  
  for (const dir of DIRECTORIES_TO_CHECK) {
    console.log(`  Checking ${dir}/`);
    allViolations = allViolations.concat(scanDirectory(dir));
  }
  
  if (allViolations.length === 0) {
    console.log('✅ No raw Supabase URLs detected. All media is properly proxied!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${allViolations.length} violations:`);
    console.log('');
    
    allViolations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}:${violation.line}`);
      console.log(`   ${violation.message}`);
      console.log(`   Code: ${violation.content}`);
      console.log('');
    });
    
    console.log('💡 Fix by using getProxiedMediaUrl() or /api/media/ proxy URLs instead of raw Supabase URLs.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}