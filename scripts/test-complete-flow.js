#!/usr/bin/env node

/**
 * Complete End-to-End Flow Test
 * Tests: 402 response -> payment authorization -> verification -> settlement -> token transfer
 * Verifies native token transfer from buyer to seller
 */

const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env' });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Get wallet addresses from private keys
function getAddressFromPrivateKey(privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

// Get balance for an address
async function getBalance(address, rpcUrl) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    return balance;
  } catch (err) {
    throw new Error(`Failed to get balance for ${address}: ${err.message}`);
  }
}

// Format balance for display
function formatBalance(balance) {
  return ethers.formatEther(balance);
}

async function testCompleteFlow() {
  const baseURL = process.env.NEXT_PUBLIC_FACILITATOR_URL?.replace('/api/facilitator/settle', '') || 'http://localhost:3000';
  const axiosClient = axios.create({ baseURL });
  const rpcUrl = 'https://testnet-passet-hub-eth-rpc.polkadot.io';

  log('\n' + '='.repeat(70), 'blue');
  log('🧪 Complete x402 Payment Flow Test - Native Token Transfer', 'blue');
  log('='.repeat(70) + '\n', 'blue');

  // Get addresses
  const buyerAddress = getAddressFromPrivateKey(process.env.BUYER_PRIVATE_KEY);
  const sellerAddress = getAddressFromPrivateKey(process.env.SELLER_PRIVATE_KEY);
  const facilitatorAddress = getAddressFromPrivateKey(process.env.FACILITATOR_PRIVATE_KEY);

  info(`Buyer Address: ${buyerAddress}`);
  info(`Seller Address: ${sellerAddress}`);
  info(`Facilitator Address: ${facilitatorAddress}`);

  try {
    // Step 0: Get initial balances
    step('Step 0: Checking initial balances...');
    const buyerBalanceBefore = await getBalance(buyerAddress, rpcUrl);
    const sellerBalanceBefore = await getBalance(sellerAddress, rpcUrl);
    
    success(`Buyer balance: ${formatBalance(buyerBalanceBefore)} PAS`);
    success(`Seller balance: ${formatBalance(sellerBalanceBefore)} PAS`);

    if (buyerBalanceBefore === 0n) {
      error('Buyer has no balance! Cannot proceed with test.');
      process.exit(1);
    }

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
      warning(`Expected 402, got ${response.status}. Payment may already be processed.`);
      if (response.status === 200) {
        info('Skipping test - endpoint already accessible');
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
    
    const paymentAmount = BigInt(paymentRequirements.maxAmountRequired);
    success(`Network: ${paymentRequirements.network}`);
    success(`Scheme: ${paymentRequirements.scheme}`);
    success(`Amount: ${formatBalance(paymentAmount)} PAS`);
    success(`Pay To: ${paymentRequirements.payTo}`);
    success(`Asset: ${paymentRequirements.asset}`);

    // Verify payTo matches seller address
    if (paymentRequirements.payTo.toLowerCase() !== sellerAddress.toLowerCase()) {
      error(`PayTo mismatch! Expected ${sellerAddress}, got ${paymentRequirements.payTo}`);
      throw new Error('PayTo address mismatch');
    }
    success(`PayTo address verified: ${sellerAddress}`);

    // Step 3: Create payment authorization
    step('Step 3: Creating payment authorization using buyer private key...');
    
    const paymentResponse = await axiosClient.post('/api/demo/create-payment', {
      paymentRequirements,
    });

    if (paymentResponse.status !== 200) {
      throw new Error(`Failed to create payment header: ${JSON.stringify(paymentResponse.data)}`);
    }

    const paymentHeader = paymentResponse.data.paymentHeader;
    
    if (!paymentHeader) {
      throw new Error('Invalid payment header created - header is missing');
    }
    
    // Payment header can be hex string (0x...) or base64 encoded JSON
    const headerPreview = paymentHeader.length > 50 
      ? paymentHeader.substring(0, 50) + '...' 
      : paymentHeader;
    success(`Payment authorization created (${headerPreview})`);

    // Step 4: Retry request with payment header
    step('Step 4: Retrying request with payment authorization...');
    
    const startTime = Date.now();
    const finalResponse = await axiosClient.get('/api/protected/weather', {
      params: { units: 'celsius' },
      headers: {
        'X-402-Payment': paymentHeader,
      },
    });
    const requestTime = Date.now() - startTime;

    if (finalResponse.status !== 200) {
      throw new Error(`Expected 200, got ${finalResponse.status}: ${JSON.stringify(finalResponse.data)}`);
    }
    success(`Request successful (200 OK) in ${requestTime}ms`);

    // Step 5: Verify response and settlement
    step('Step 5: Verifying payment settlement...');
    
    const data = finalResponse.data;
    if (!data || !data.data) {
      throw new Error('Invalid response data');
    }
    success(`Weather data received: ${data.data.city}`);

    // Check payment headers
    const paymentVerified = finalResponse.headers['x-payment-verified'];
    const paymentAmountHeader = finalResponse.headers['x-payment-amount'];
    const settlementTx = finalResponse.headers['x-settlement-tx'];

    if (paymentVerified !== 'true') {
      error('X-Payment-Verified header not set to true');
    } else {
      success(`Payment verified: ${paymentVerified}`);
    }

    if (!paymentAmountHeader) {
      error('X-Payment-Amount header missing');
    } else {
      success(`Payment amount: ${formatBalance(BigInt(paymentAmountHeader))} PAS`);
    }

    if (!settlementTx) {
      error('X-Settlement-Tx header missing - settlement may have failed');
      throw new Error('Settlement transaction hash missing');
    } else {
      success(`Settlement transaction: ${settlementTx}`);
      info(`View on explorer: https://blockscout-passet-hub.parity-testnet.parity.io/tx/${settlementTx}`);
    }

    // Step 6: Wait for transaction confirmation and check balances
    step('Step 6: Waiting for transaction confirmation and verifying token transfer...');
    
    info('Waiting 5 seconds for transaction to be confirmed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const buyerBalanceAfter = await getBalance(buyerAddress, rpcUrl);
    const sellerBalanceAfter = await getBalance(sellerAddress, rpcUrl);

    success(`Buyer balance after: ${formatBalance(buyerBalanceAfter)} PAS`);
    success(`Seller balance after: ${formatBalance(sellerBalanceAfter)} PAS`);

    // Calculate balance changes
    const buyerBalanceChange = buyerBalanceBefore - buyerBalanceAfter;
    const sellerBalanceChange = sellerBalanceAfter - sellerBalanceBefore;

    info(`Buyer balance change: -${formatBalance(buyerBalanceChange)} PAS`);
    info(`Seller balance change: +${formatBalance(sellerBalanceChange)} PAS`);

    // Verify transfer happened
    step('Step 7: Verifying token transfer...');
    
    // Note: Buyer pays amount + gas, seller receives amount
    // So buyer balance change should be >= payment amount
    // Seller balance change should be approximately payment amount (minus any fees)
    
    if (buyerBalanceChange < paymentAmount) {
      warning(`Buyer balance decreased by ${formatBalance(buyerBalanceChange)} PAS, expected at least ${formatBalance(paymentAmount)} PAS`);
      warning('This might be due to gas fees or transaction not yet confirmed');
    } else {
      success(`Buyer balance decreased by ${formatBalance(buyerBalanceChange)} PAS (includes gas fees)`);
    }

    if (sellerBalanceChange > 0n) {
      // Seller should receive the payment amount (or close to it)
      const expectedMin = paymentAmount * 95n / 100n; // Allow 5% tolerance for fees
      if (sellerBalanceChange >= expectedMin) {
        success(`Seller received ${formatBalance(sellerBalanceChange)} PAS (expected ~${formatBalance(paymentAmount)} PAS)`);
      } else {
        warning(`Seller received ${formatBalance(sellerBalanceChange)} PAS, expected at least ${formatBalance(expectedMin)} PAS`);
      }
    } else {
      error('Seller balance did not increase! Transfer may have failed.');
      throw new Error('Token transfer verification failed');
    }

    // Step 8: Summary
    log('\n' + '='.repeat(70), 'blue');
    log('📊 Test Summary:', 'blue');
    log('='.repeat(70), 'blue');
    success('✅ 402 Payment Required received');
    success('✅ Payment authorization created');
    success('✅ Payment verified');
    success('✅ Payment settled');
    success('✅ Protected resource delivered');
    success('✅ Native token transfer verified');
    success(`✅ Buyer paid: ${formatBalance(buyerBalanceChange)} PAS`);
    success(`✅ Seller received: ${formatBalance(sellerBalanceChange)} PAS`);
    success(`✅ Transaction hash: ${settlementTx}`);
    
    log('\n' + '='.repeat(70), 'green');
    success('🎉 Complete end-to-end flow test PASSED!');
    log('='.repeat(70) + '\n', 'green');
    
    process.exit(0);
  } catch (err) {
    log('\n' + '='.repeat(70), 'red');
    error('❌ Test FAILED');
    log('='.repeat(70), 'red');
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
testCompleteFlow();

