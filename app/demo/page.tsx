'use client';

import { useState } from 'react';
import axios from 'axios';
import CodeBlock from '@/components/CodeBlock';

interface DemoState {
  status: 'idle' | 'loading' | 'success' | 'error';
  weatherData?: any;
  transactionHash?: string;
  responseHeaders?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  error?: string;
  paymentDetails?: {
    amount?: string;
    network?: string;
    payTo?: string;
    token?: string;
  };
  step?: string;
}

export default function DemoPage() {
  const [demoState, setDemoState] = useState<DemoState>({ status: 'idle' });

  const runDemo = async () => {
    setDemoState({ status: 'loading', step: 'Initializing...' });

    try {
      // Step 1: Make initial request to get 402 Payment Required response
      setDemoState({ status: 'loading', step: 'Step 1: Making initial request (expecting 402)...' });
      
      const axiosClient = axios.create({
        baseURL: typeof window !== 'undefined' ? window.location.origin : '',
      });

      let response;
      try {
        response = await axiosClient.get('/api/protected/weather', {
          params: { units: 'celsius' },
          validateStatus: (status) => status === 402 || status === 200, // Accept 402 and 200
        });
      } catch (error: any) {
        if (error.response?.status === 402) {
          response = error.response;
        } else {
          throw error;
        }
      }

      // Step 2: If we got 402, extract payment requirements
      if (response.status !== 402) {
        // Already paid or no payment required
        const data = response.data;
        setDemoState({
          status: 'success',
          weatherData: data.data,
          transactionHash: response.headers['x-settlement-tx'],
          responseHeaders: response.headers as any,
          requestHeaders: {},
          paymentDetails: {
            amount: response.headers['x-payment-amount'] || '0',
            network: 'polkadot-hub-testnet',
          },
        });
        return;
      }

      setDemoState({ status: 'loading', step: 'Step 2: Received 402 Payment Required, extracting payment requirements...' });

      const paymentRequirements = response.data;
      
      // Step 3: Create signer from buyer's private key (server-side API call)
      setDemoState({ status: 'loading', step: 'Step 3: Creating payment authorization...' });
      
      // Call our API endpoint to create the payment header using buyer's private key
      // This is done server-side to keep the private key secure
      const paymentResponse = await axiosClient.post('/api/demo/create-payment', {
        paymentRequirements,
      });

      const paymentHeader = paymentResponse.data.paymentHeader;

      // Step 4: Retry request with payment header
      setDemoState({ status: 'loading', step: 'Step 4: Retrying request with payment authorization...' });

      const finalResponse = await axiosClient.get('/api/protected/weather', {
        params: { units: 'celsius' },
        headers: {
          'X-402-Payment': paymentHeader,
        },
      });

      // Step 5: Extract response data
      setDemoState({ status: 'loading', step: 'Step 5: Payment verified and settled!' });

      const data = finalResponse.data;

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      Object.keys(finalResponse.headers).forEach((key) => {
        const value = finalResponse.headers[key];
        if (key.toLowerCase().startsWith('x-') || 
            ['cache-control', 'content-type', 'date', 'server'].includes(key.toLowerCase())) {
          responseHeaders[key] = String(value);
        }
      });

      // Extract payment amount from response headers
      const paymentAmount = finalResponse.headers['x-payment-amount'] || '0';

      // Extract transaction hash
      const transactionHash = finalResponse.headers['x-settlement-tx'];

      // Extract payment response header if available
      let paymentResponseData;
      const paymentResponseHeader = finalResponse.headers['x-payment-response'];
      if (paymentResponseHeader) {
        try {
          paymentResponseData = JSON.parse(paymentResponseHeader);
        } catch (e) {
          // Ignore parse errors
        }
      }

      setDemoState({
        status: 'success',
        weatherData: data.data,
        transactionHash: transactionHash || paymentResponseData?.transactionHash,
        responseHeaders,
        requestHeaders: {
          'X-402-Payment': paymentHeader.substring(0, 100) + '...', // Truncate for display
        },
        paymentDetails: {
          amount: paymentAmount,
          network: paymentRequirements.network || 'polkadot-hub-testnet',
          payTo: paymentRequirements.payTo,
          token: paymentRequirements.asset,
        },
      });
    } catch (error) {
      setDemoState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const resetDemo = () => {
    setDemoState({ status: 'idle' });
  };

  return (
    <main className="min-h-screen bg-[color:var(--tone-light)] pt-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[color:var(--tone-dark)] mb-3">
            x402 Payment Protocol Demo
          </h1>
          <p className="text-lg text-[color:var(--tone-dark)]/70">
            HTTP 402 on Polkadot Hub TestNet
          </p>
        </div>

        {/* Start Demo Button */}
        {demoState.status === 'idle' && (
          <div className="text-center mb-12">
            <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-8 max-w-md mx-auto mb-6">
              <p className="text-sm text-[color:var(--tone-dark)]/70 mb-4">
                This demo uses the buyer's private key from environment variables to sign payment authorizations.
              </p>
              <button
                onClick={runDemo}
                className="btn btn-primary text-lg px-8 py-4"
              >
                Request Weather Data →
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {demoState.status === 'loading' && (
          <div className="text-center mb-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--tone-dark)]"></div>
            <p className="mt-4 text-[color:var(--tone-dark)]/70">{demoState.step || 'Processing payment...'}</p>
          </div>
        )}

        {/* Results Grid */}
        {(demoState.status === 'success' || demoState.status === 'error') && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - API Response */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-[color:var(--tone-dark)] mb-6">
                API Response
              </h2>

              {/* Status */}
              <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-2">Status</p>
                <p className="text-xl font-bold text-[color:var(--tone-dark)]">
                  {demoState.status === 'success' ? '200 OK' : 'Error'}
                </p>
              </div>

              {/* Weather Data */}
              {demoState.status === 'success' && demoState.weatherData && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-4">Weather Data</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">City:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.weatherData.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Temperature:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">
                        {demoState.weatherData.temperature} {demoState.weatherData.units}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Condition:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.weatherData.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Humidity:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.weatherData.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Wind Speed:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">
                        {demoState.weatherData.windSpeed} {demoState.weatherData.windSpeedUnits}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Headers */}
              {demoState.status === 'success' && demoState.responseHeaders && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-3">Response Headers</p>
                  <CodeBlock
                    code={JSON.stringify(demoState.responseHeaders, null, 2)}
                    language="json"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Payment Status */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-[color:var(--tone-dark)] mb-6">
                Payment Status
              </h2>

              {/* Success Message */}
              {demoState.status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-900 font-semibold mb-1">Payment verified and settled.</p>
                      <p className="text-green-700 text-sm">The protected resource has been delivered.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {demoState.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-red-900 font-semibold mb-1">Payment failed</p>
                      <p className="text-red-700 text-sm">{demoState.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              {demoState.status === 'success' && demoState.transactionHash && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-3">Transaction Hash</p>
                  <p className="text-sm font-mono text-[color:var(--tone-dark)] break-all mb-3">
                    {demoState.transactionHash}
                  </p>
                  <a
                    href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${demoState.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[color:var(--tone-dark)]/70 hover:text-[color:var(--tone-dark)] underline"
                  >
                    View on Explorer →
                  </a>
                </div>
              )}

              {/* Payment Details */}
              {demoState.status === 'success' && demoState.paymentDetails && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-4">Payment Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Amount:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">
                        {demoState.paymentDetails.amount ? (Number(demoState.paymentDetails.amount) / 1e18).toFixed(6) : '0'} PAS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Network:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.paymentDetails.network}</span>
                    </div>
                    {demoState.paymentDetails.payTo && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--tone-dark)]/70">Pay To:</span>
                        <span className="text-[color:var(--tone-dark)] font-semibold font-mono text-xs">
                          {demoState.paymentDetails.payTo.substring(0, 10)}...{demoState.paymentDetails.payTo.substring(38)}
                        </span>
                      </div>
                    )}
                    {demoState.paymentDetails.token && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--tone-dark)]/70">Token:</span>
                        <span className="text-[color:var(--tone-dark)] font-semibold">
                          {demoState.paymentDetails.token === 'native' ? 'Native (PAS)' : demoState.paymentDetails.token}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request Headers */}
              {demoState.status === 'success' && demoState.requestHeaders && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-3">Payment Authorization</p>
                  <CodeBlock
                    code={JSON.stringify(demoState.requestHeaders, null, 2)}
                    language="json"
                  />
                </div>
              )}

              {/* How it works */}
              {demoState.status === 'success' && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-4">x402 Payment Flow</p>
                  <ol className="space-y-3 text-sm text-[color:var(--tone-dark)]/80">
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">1.</span>
                      <span>Initial Request: Tries to access resource (no payment)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">2.</span>
                      <span>Receives 402 Payment Required with payment requirements</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">3.</span>
                      <span>Buyer signs EIP-712 authorization (approval) using private key</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">4.</span>
                      <span>Retries request with X-402-Payment header containing authorization</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">5.</span>
                      <span>Facilitator verifies authorization and calls transferWithAuthorization on token contract</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">6.</span>
                      <span>Server returns protected resource with settlement transaction hash</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Start Over Button */}
              <button
                onClick={resetDemo}
                className="w-full btn btn-primary"
              >
                Start Over →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
