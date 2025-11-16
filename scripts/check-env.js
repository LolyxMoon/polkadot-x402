#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Checks that all required environment variables are present and valid
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Colors for terminal output
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

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    error(`.env file not found at ${envPath}`);
    info('Create a .env file based on .env.example');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

// Required environment variables
const REQUIRED_VARS = {
  // Server-side only (no NEXT_PUBLIC_ prefix)
  FACILITATOR_PRIVATE_KEY: {
    required: true,
    validate: (value) => {
      if (!value.startsWith('0x')) {
        return 'Must start with 0x';
      }
      if (value.length !== 66) {
        return `Must be 66 characters (got ${value.length})`;
      }
      try {
        new ethers.Wallet(value);
        return null; // Valid
      } catch (e) {
        return 'Invalid private key format';
      }
    },
  },
  BUYER_PRIVATE_KEY: {
    required: true,
    validate: (value) => {
      if (!value.startsWith('0x')) {
        return 'Must start with 0x';
      }
      if (value.length !== 66) {
        return `Must be 66 characters (got ${value.length})`;
      }
      try {
        new ethers.Wallet(value);
        return null; // Valid
      } catch (e) {
        return 'Invalid private key format';
      }
    },
  },
  SELLER_PRIVATE_KEY: {
    required: true,
    validate: (value) => {
      if (!value.startsWith('0x')) {
        return 'Must start with 0x';
      }
      if (value.length !== 66) {
        return `Must be 66 characters (got ${value.length})`;
      }
      try {
        new ethers.Wallet(value);
        return null; // Valid
      } catch (e) {
        return 'Invalid private key format';
      }
    },
  },
  FACILITATOR_URL: {
    required: true,
    validate: (value) => {
      if (!value) {
        return 'Cannot be empty';
      }
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Must be a valid URL starting with http:// or https://';
      }
      return null;
    },
  },
};

// Optional client-side variables (should have NEXT_PUBLIC_ prefix)
const OPTIONAL_CLIENT_VARS = {
  NEXT_PUBLIC_FACILITATOR_URL: {
    validate: (value) => {
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Must be a valid URL starting with http:// or https://';
      }
      return null;
    },
  },
};

function validateEnv() {
  log('\n🔍 Checking Environment Variables...\n', 'blue');
  
  const env = loadEnvFile();
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required server-side variables
  log('📋 Required Server-Side Variables:', 'cyan');
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = env[key];
    
    if (!value) {
      error(`${key}: MISSING`);
      hasErrors = true;
      continue;
    }
    
    // Mask sensitive values
    const displayValue = key.includes('PRIVATE_KEY') 
      ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
      : value;
    
    const validationError = config.validate(value);
    if (validationError) {
      error(`${key}: INVALID - ${validationError}`);
      info(`  Value: ${displayValue}`);
      hasErrors = true;
    } else {
      success(`${key}: OK`);
      info(`  Value: ${displayValue}`);
    }
  }
  
  // Check optional client-side variables
  log('\n📋 Optional Client-Side Variables (NEXT_PUBLIC_ prefix):', 'cyan');
  for (const [key, config] of Object.entries(OPTIONAL_CLIENT_VARS)) {
    const value = env[key];
    
    if (!value) {
      warning(`${key}: Not set (optional)`);
      hasWarnings = true;
    } else {
      const validationError = config.validate(value);
      if (validationError) {
        error(`${key}: INVALID - ${validationError}`);
        hasErrors = true;
      } else {
        success(`${key}: OK`);
        info(`  Value: ${value}`);
      }
    }
  }
  
  // Check for private keys with NEXT_PUBLIC_ prefix (security issue)
  log('\n🔒 Security Check:', 'cyan');
  const securityIssues = [];
  for (const key of Object.keys(env)) {
    if (key.includes('PRIVATE_KEY') && key.startsWith('NEXT_PUBLIC_')) {
      securityIssues.push(key);
      error(`SECURITY RISK: ${key} has NEXT_PUBLIC_ prefix! Private keys should NEVER be exposed to client-side.`);
      hasErrors = true;
    }
  }
  
  if (securityIssues.length === 0) {
    success('No private keys exposed to client-side');
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  if (hasErrors) {
    error('\n❌ Validation FAILED - Please fix the errors above');
    process.exit(1);
  } else if (hasWarnings) {
    warning('\n⚠️  Validation PASSED with warnings');
    info('Some optional variables are not set, but this is OK');
    process.exit(0);
  } else {
    success('\n✅ All environment variables are valid!');
    process.exit(0);
  }
}

// Run validation
validateEnv();

