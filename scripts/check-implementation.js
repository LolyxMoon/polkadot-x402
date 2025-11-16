#!/usr/bin/env node

/**
 * Implementation Check Script
 * Validates the entire x402 facilitator implementation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    success(`${description}: ${filePath}`);
    return true;
  } else {
    error(`${description}: ${filePath} - NOT FOUND`);
    return false;
  }
}

function checkRequiredFiles() {
  log('\n📁 Checking Required Files...\n', 'blue');
  
  const requiredFiles = [
    { path: 'lib/env.ts', desc: 'Environment configuration' },
    { path: 'lib/env.client.ts', desc: 'Client-side environment config' },
    { path: 'lib/evm/wallet.ts', desc: 'EVM wallet utilities' },
    { path: 'lib/evm/networks.ts', desc: 'Network configuration' },
    { path: 'lib/x402/verify.ts', desc: 'x402 verification logic' },
    { path: 'lib/x402/settle.ts', desc: 'x402 settlement logic' },
    { path: 'middleware.ts', desc: 'Next.js middleware' },
    { path: 'app/api/facilitator/supported/route.ts', desc: 'Supported endpoint' },
    { path: 'app/api/facilitator/verify/route.ts', desc: 'Verify endpoint' },
    { path: 'app/api/facilitator/settle/route.ts', desc: 'Settle endpoint' },
    { path: 'app/api/protected/weather/route.ts', desc: 'Protected weather endpoint' },
    { path: 'app/demo/page.tsx', desc: 'Demo page' },
    { path: '.env', desc: 'Environment file' },
  ];
  
  let allExist = true;
  for (const file of requiredFiles) {
    if (!checkFileExists(file.path, file.desc)) {
      allExist = false;
    }
  }
  
  return allExist;
}

function checkEnvVariables() {
  log('\n🔍 Checking Environment Variables...\n', 'blue');
  
  try {
    execSync('node scripts/check-env.js', { stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
}

function checkBuild() {
  log('\n🔨 Checking Build...\n', 'blue');
  
  try {
    info('Running TypeScript check...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    success('TypeScript compilation: OK');
    return true;
  } catch (e) {
    error('TypeScript compilation: FAILED');
    info('Run "npm run build" to see detailed errors');
    return false;
  }
}

function checkImports() {
  log('\n📦 Checking Critical Imports...\n', 'blue');
  
  const criticalImports = [
    { file: 'lib/x402/verify.ts', imports: ['x402/facilitator', 'x402/types'] },
    { file: 'lib/x402/settle.ts', imports: ['x402/facilitator', 'x402/types'] },
    { file: 'app/demo/page.tsx', imports: ['x402-axios'] },
  ];
  
  let allValid = true;
  for (const check of criticalImports) {
    const filePath = path.join(process.cwd(), check.file);
    if (!fs.existsSync(filePath)) {
      error(`${check.file}: File not found`);
      allValid = false;
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const imp of check.imports) {
      if (content.includes(imp)) {
        success(`${check.file}: Imports ${imp}`);
      } else {
        error(`${check.file}: Missing import ${imp}`);
        allValid = false;
      }
    }
  }
  
  return allValid;
}

function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 x402 Facilitator Implementation Check', 'blue');
  log('='.repeat(60) + '\n', 'blue');
  
  const results = {
    files: checkRequiredFiles(),
    env: checkEnvVariables(),
    build: checkBuild(),
    imports: checkImports(),
  };
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Summary:', 'blue');
  log('='.repeat(60), 'blue');
  
  for (const [check, passed] of Object.entries(results)) {
    if (passed) {
      success(`${check}: PASSED`);
    } else {
      error(`${check}: FAILED`);
    }
  }
  
  const allPassed = Object.values(results).every(r => r);
  
  log('\n' + '='.repeat(60), 'blue');
  if (allPassed) {
    success('✅ All checks PASSED! Implementation looks good.');
    process.exit(0);
  } else {
    error('❌ Some checks FAILED. Please fix the issues above.');
    process.exit(1);
  }
}

main();

