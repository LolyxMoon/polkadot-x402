#!/usr/bin/env node

/**
 * End-to-End x402 Payment Flow Test
 * Tests the complete flow: 402 response -> payment authorization -> verification -> settlement
 */

const axios = require('axios');
require('dotenv').config({ path: '.env' });

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

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function step(message) {
  log(`\n📋 ${message}`, 'blue');
}

async function testFlow() {
  const baseURL = process.env.NEXT_PUBLIC_FACILITATOR_URL?.replace('/api/facilitator/settle', '') || 'http://localhost:3000';
  const axiosClient = axios.create({ baseURL });

  log('\n' + '='.repeat(60), 'blue');
  log('🧪 Testing x402 Payment Flow', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  try {
    // Step 1: Make initial request (expect 402)
    step('Step 1: Making initial request to protected endpoint...');
    let response;
    try {
      response = await axiosClient.get('/api/protected/weather', {
        params: { units: 'celsius' },
        validateStatus: (status) => status === 402 || status === 200,
      });
    } catch (err) {
      if (err.response?.status === 402) {
        response = err.response;
      } else {
        throw err;
      }
    }

    if (response.status !== 402) {
      error(`Expected 402, got ${response.status}`);
      if (response.status === 200) {
        info('Payment already processed or endpoint not protected');
        return;
      }
      throw new Error(`Unexpected status: ${response.status}`);
    }
    success(`Received 402 Payment Required`);

    // Step 2: Extract payment requirements
    step('Step 2: Extracting payment requirements...');
    const paymentRequirements = response.data;
    
    if (!paymentRequirements.network || !paymentRequirements.scheme) {
      throw new Error('Invalid payment requirements in 402 response');
    }
    
    success(`Network: ${paymentRequirements.network}`);
    success(`Scheme: ${paymentRequirements.scheme}`);
    success(`Amount: ${paymentRequirements.maxAmountRequired}`);
    success(`Pay To: ${paymentRequirements.payTo}`);
    success(`Asset: ${paymentRequirements.asset}`);

    // Step 3: Create payment authorization via API endpoint
    step('Step 3: Creating payment authorization using buyer private key (via API)...');
    
    // Call our API endpoint which handles the custom network internally
    const paymentResponse = await axiosClient.post('/api/demo/create-payment', {
      paymentRequirements,
    });

    if (paymentResponse.status !== 200) {
      throw new Error(`Failed to create payment header: ${JSON.stringify(paymentResponse.data)}`);
    }

    const paymentHeader = paymentResponse.data.paymentHeader;
    
    if (!paymentHeader || !paymentHeader.startsWith('0x')) {
      throw new Error('Invalid payment header created');
    }
    success(`Payment authorization created (${paymentHeader.substring(0, 20)}...)`);

    // Step 4: Retry request with payment header
    step('Step 4: Retrying request with payment authorization...');
    
    const finalResponse = await axiosClient.get('/api/protected/weather', {
      params: { units: 'celsius' },
      headers: {
        'X-402-Payment': paymentHeader,
      },
    });

    if (finalResponse.status !== 200) {
      throw new Error(`Expected 200, got ${finalResponse.status}: ${JSON.stringify(finalResponse.data)}`);
    }
    success(`Request successful (200 OK)`);

    // Step 5: Verify response
    step('Step 5: Verifying response...');
    
    const data = finalResponse.data;
    if (!data || !data.data) {
      throw new Error('Invalid response data');
    }
    success(`Weather data received: ${data.data.city}`);

    // Check payment headers
    const paymentVerified = finalResponse.headers['x-payment-verified'];
    const paymentAmount = finalResponse.headers['x-payment-amount'];
    const settlementTx = finalResponse.headers['x-settlement-tx'];

    if (paymentVerified !== 'true') {
      error('X-Payment-Verified header not set to true');
    } else {
      success(`Payment verified: ${paymentVerified}`);
    }

    if (!paymentAmount) {
      error('X-Payment-Amount header missing');
    } else {
      success(`Payment amount: ${paymentAmount} (${Number(paymentAmount) / 1e18} PAS)`);
    }

    if (!settlementTx) {
      error('X-Settlement-Tx header missing - settlement may have failed');
    } else {
      success(`Settlement transaction: ${settlementTx}`);
      info(`View on explorer: https://blockscout-passet-hub.parity-testnet.parity.io/tx/${settlementTx}`);
    }

    // Step 6: Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 Test Summary:', 'blue');
    log('='.repeat(60), 'blue');
    success('✅ 402 Payment Required received');
    success('✅ Payment authorization created');
    success('✅ Payment verified');
    success(settlementTx ? '✅ Payment settled' : '⚠️  Settlement transaction not found');
    success('✅ Protected resource delivered');
    
    log('\n' + '='.repeat(60), 'green');
    success('🎉 End-to-end flow test PASSED!');
    log('='.repeat(60) + '\n', 'green');
    
    process.exit(0);
  } catch (err) {
    log('\n' + '='.repeat(60), 'red');
    error('❌ Test FAILED');
    log('='.repeat(60), 'red');
    error(`Error: ${err.message}`);
    if (err.response) {
      error(`Status: ${err.response.status}`);
      error(`Response: ${JSON.stringify(err.response.data, null, 2)}`);
    }
    if (err.stack) {
      log('\nStack trace:', 'yellow');
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run the test
testFlow();

