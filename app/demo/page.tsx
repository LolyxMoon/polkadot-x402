'use client';

import { useState } from 'react';
import CodeBlock from '@/components/CodeBlock';

interface DemoState {
  status: 'idle' | 'loading' | 'success' | 'error';
  transactionHash?: string;
  verificationTime?: number;
  settlementTime?: number;
  totalTime?: number;
  apiProcessingTime?: number;
  responseHeaders?: Record<string, string>;
  error?: string;
}

export default function DemoPage() {
  const [demoState, setDemoState] = useState<DemoState>({ status: 'idle' });

  const runDemo = async () => {
    setDemoState({ status: 'loading' });

    try {
      // Generate a mock payload for demo purposes
      const mockPayload = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const paymentDetails = {
        x402Version: 1,
        scheme: 'exact',
        network: 'polkadot-hub-testnet',
        extra: {},
      };

      // Call the demo API endpoint that simulates the full x402 flow
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: mockPayload,
          details: paymentDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Demo request failed');
      }

      // Extract response headers from the response
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('x-') || 
            ['cache-control', 'content-type', 'date', 'server'].includes(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      });

      setDemoState({
        status: 'success',
        transactionHash: data.transactionHash,
        verificationTime: data.timing?.verification,
        settlementTime: data.timing?.settlement,
        totalTime: data.timing?.total,
        apiProcessingTime: data.timing?.apiProcessing,
        responseHeaders,
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

        {/* Demo Button */}
        {demoState.status === 'idle' && (
          <div className="text-center mb-12">
            <button
              onClick={runDemo}
              className="btn btn-primary text-lg px-8 py-4"
            >
              Start Demo →
            </button>
          </div>
        )}

        {/* Loading State */}
        {demoState.status === 'loading' && (
          <div className="text-center mb-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--tone-dark)]"></div>
            <p className="mt-4 text-[color:var(--tone-dark)]/70">Processing payment...</p>
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

              {/* Response Time */}
              {demoState.status === 'success' && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-4">Response Time</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Total:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.totalTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Verification:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.verificationTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">Settlement:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.settlementTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--tone-dark)]/70">API Processing:</span>
                      <span className="text-[color:var(--tone-dark)] font-semibold">{demoState.apiProcessingTime}ms</span>
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

              {/* Request Headers */}
              {demoState.status === 'success' && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-3">Request Headers</p>
                  <CodeBlock
                    code={JSON.stringify({ 'X-PAYMENT': 'Automatically handled by x402Axios' }, null, 2)}
                    language="json"
                  />
                </div>
              )}

              {/* How it works */}
              {demoState.status === 'success' && (
                <div className="bg-[color:var(--tone-light)]/50 border border-[color:var(--tone-border)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-4">How x402Axios works</p>
                  <ol className="space-y-3 text-sm text-[color:var(--tone-dark)]/80">
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">1.</span>
                      <span>Initial Request: Tries to access resource (no payment)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">2.</span>
                      <span>Receives 402 Payment Required with x402 payment details</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">3.</span>
                      <span>Signs payment authorization using wallet</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">4.</span>
                      <span>Retries request with X-PAYMENT header</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[color:var(--tone-dark)]">5.</span>
                      <span>Server verifies and settles payment automatically</span>
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

