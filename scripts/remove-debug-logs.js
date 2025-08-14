#!/usr/bin/env node

// Script to help identify console.log statements that need to be replaced
// Run with: node scripts/remove-debug-logs.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const IGNORE_FILES = ['logger.js', 'config.js']; // Files to skip

function findConsoleLogs(dir) {
  const results = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (stat.isFile() && file.endsWith('.js') && !IGNORE_FILES.includes(file)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
            results.push({
              file: path.relative(SRC_DIR, filePath),
              line: index + 1,
              content: line.trim(),
              type: line.includes('console.log') ? 'log' : line.includes('console.error') ? 'error' : 'warn'
            });
          }
        });
      }
    }
  }
  
  scanDirectory(dir);
  return results;
}

function generateReport(consoleLogs) {
  console.log('\n=== CONSOLE LOG ANALYSIS REPORT ===\n');
  
  if (consoleLogs.length === 0) {
    console.log('✅ No console.log statements found!');
    return;
  }
  
  console.log(`Found ${consoleLogs.length} console statements:\n`);
  
  const byFile = {};
  consoleLogs.forEach(log => {
    if (!byFile[log.file]) {
      byFile[log.file] = [];
    }
    byFile[log.file].push(log);
  });
  
  Object.keys(byFile).sort().forEach(file => {
    console.log(`📁 ${file}:`);
    byFile[file].forEach(log => {
      const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} Line ${log.line}: ${log.content}`);
    });
    console.log('');
  });
  
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. Replace console.log with logger.log(component, message, data)');
  console.log('2. Replace console.error with logger.error(component, message, error)');
  console.log('3. Replace console.warn with logger.warn(component, message, data)');
  console.log('4. Remove sensitive data from log messages');
  console.log('5. Use logger.debug() for development-only logs');
}

// Run the analysis
const consoleLogs = findConsoleLogs(SRC_DIR);
generateReport(consoleLogs);
