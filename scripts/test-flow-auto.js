/**
 * Automated test script for x402 payment flow
 * Tests the complete flow: request -> 402 -> create payment -> verify -> settle -> response
 * Runs repeatedly until successful
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_ATTEMPTS = 10;
const DELAY_BETWEEN_ATTEMPTS = 2000; // 2 seconds

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function error(message, data = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (data) {
    console.error(JSON.stringify(data, null, 2));
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFlow() {
  log('Starting x402 payment flow test...');
  
  try {
    // Step 1: Make initial request to protected endpoint (expect 402)
    log('Step 1: Making initial request to /api/protected/weather...');
    let response;
    try {
      response = await axios.get(`${BASE_URL}/api/protected/weather`, {
        validateStatus: (status) => status === 402, // Expect 402
      });
    } catch (err) {
      if (err.response?.status === 402) {
        response = err.response;
      } else {
        throw err;
      }
    }

    if (response.status !== 402) {
      throw new Error(`Expected 402, got ${response.status}`);
    }
    log('✓ Received 402 Payment Required');

    // Step 2: Extract payment requirements
    const paymentRequirements = response.data;
    log('Step 2: Extracted payment requirements', {
      network: paymentRequirements.network,
      amount: paymentRequirements.maxAmountRequired,
      payTo: paymentRequirements.payTo,
      asset: paymentRequirements.asset,
    });

    if (!paymentRequirements.network || !paymentRequirements.payTo) {
      throw new Error('Invalid payment requirements in 402 response');
    }

    // Step 3: Create payment authorization
    log('Step 3: Creating payment authorization...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/demo/create-payment`, {
      paymentRequirements,
    });

    if (!paymentResponse.data?.paymentHeader) {
      throw new Error(`Payment creation failed: ${JSON.stringify(paymentResponse.data)}`);
    }

    const paymentHeader = paymentResponse.data.paymentHeader;
    log('✓ Payment authorization created', {
      headerLength: paymentHeader.length,
      network: paymentResponse.data.network,
      address: paymentResponse.data.address,
    });

    // Step 4: Retry request with payment header
    log('Step 4: Retrying request with payment header...');
    const finalResponse = await axios.get(`${BASE_URL}/api/protected/weather`, {
      headers: {
        'X-402-Payment': paymentHeader,
        'X-402-Payment-Details': JSON.stringify(paymentRequirements),
      },
    });

    if (finalResponse.status !== 200) {
      throw new Error(`Expected 200, got ${finalResponse.status}: ${JSON.stringify(finalResponse.data)}`);
    }

    log('✓ Request successful!', {
      status: finalResponse.status,
      weatherData: finalResponse.data,
      transactionHash: finalResponse.headers['x-settlement-tx'],
      paymentAmount: finalResponse.headers['x-payment-amount'],
    });

    // Step 5: Verify response
    if (!finalResponse.data) {
      throw new Error('No data in response');
    }

    const transactionHash = finalResponse.headers['x-settlement-tx'];
    if (!transactionHash) {
      // Check if there's an error in the response
      if (finalResponse.data.error) {
        throw new Error(`Settlement failed: ${finalResponse.data.error} - ${JSON.stringify(finalResponse.data)}`);
      }
      throw new Error('No transaction hash in response headers. Response: ' + JSON.stringify(finalResponse.data));
    }

    log('✓ Transaction hash received', { transactionHash });

    log('✅ TEST PASSED - Complete flow successful!');
    return { success: true, transactionHash, weatherData: finalResponse.data };

  } catch (err) {
    const errorMessage = err.response?.data 
      ? JSON.stringify(err.response.data, null, 2)
      : err.message;
    
    // Detailed error logging
    error('Test failed', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers ? Object.fromEntries(
        Object.entries(err.response.headers).filter(([k]) => 
          k.toLowerCase().startsWith('x-') || ['content-type', 'content-length'].includes(k.toLowerCase())
        )
      ) : undefined,
      stack: err.stack,
    });
    
    return { success: false, error: errorMessage };
  }
}

async function runTests() {
  log(`Starting automated tests (max ${MAX_ATTEMPTS} attempts)...`);
  log(`Base URL: ${BASE_URL}`);
  log('');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    log(`\n=== Attempt ${attempt}/${MAX_ATTEMPTS} ===`);
    
    const result = await testFlow();
    
    if (result.success) {
      log(`\n🎉 SUCCESS on attempt ${attempt}!`);
      log('Transaction hash:', result.transactionHash);
      log('Weather data:', result.weatherData);
      process.exit(0);
    } else {
      log(`Attempt ${attempt} failed: ${result.error}`);
      
      if (attempt < MAX_ATTEMPTS) {
        log(`Waiting ${DELAY_BETWEEN_ATTEMPTS}ms before next attempt...`);
        await sleep(DELAY_BETWEEN_ATTEMPTS);
      }
    }
  }

  error(`\n❌ All ${MAX_ATTEMPTS} attempts failed`);
  process.exit(1);
}

// Run tests
runTests().catch((err) => {
  error('Fatal error:', err);
  process.exit(1);
});

