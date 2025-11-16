import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';

export default function Home() {
  return (
    <main className="bg-[color:var(--tone-dark)]">
      <Hero />

      <section className="section-dark border-t border-[color:var(--tone-border)]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-muted)] mb-4">
                Control surface
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-[color:var(--tone-light)] max-w-2xl">
                A disciplined facilitator stack: nothing extra, everything precise.
              </h2>
            </div>
            <p className="text-[color:var(--tone-muted)] max-w-xl">
              A production-ready x402 facilitator for Polkadot Hub TestNet. Includes verification and settlement
              endpoints, client-side payment utilities, and an axios wrapper for automatic 402 handling.
              Native PAS token support with EIP-712 signature validation.
          </p>
        </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 12l3 3 9-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="Verification channel"
              description="EIP-712 based validation with strict requirement checks. Rejects anything off-spec, instantly."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 17l6.5-6.5L13 13l7-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 6h4v4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="Settlement lane"
              description="Signs and broadcasts without UI theatrics. Gas handled, hashes returned, logs intact."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5h18M3 12h18M3 19h18" strokeLinecap="round" />
                </svg>
              }
              title="Polkadot Hub TestNet"
              description="EVM-compatible chain with native PAS token support. Full x402 facilitator implementation with verify, settle, and supported endpoints."
            />
          </div>
        </div>
      </section>

      <section className="section-light border-y border-[color:var(--tone-border-strong)]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-dark)]/60 mb-4">
                Process
              </p>
              <h3 className="text-3xl font-semibold text-[color:var(--tone-dark)] mb-8">
                Three deliberate moves.
              </h3>
              <ul className="space-y-4">
                {[
                  { title: 'Verify', desc: 'Submit payload + requirements. Receive deterministic verdicts.' },
                  { title: 'Settle', desc: 'Signed transactions leave immediately. Gas is pre-configured.' },
                  { title: 'Observe', desc: 'Transaction hashes returned for your own observability stack.' },
                ].map((item, index) => (
                  <li key={item.title} className="border-l-4 border-[color:var(--tone-dark)] rounded-r-2xl p-6 bg-[color:var(--tone-dark)]/5 hover:bg-[color:var(--tone-dark)]/10 transition-all">
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[color:var(--tone-dark)] flex items-center justify-center text-sm font-bold text-[color:var(--tone-light)]">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-dark)]/70 mb-2 font-semibold">
                          {item.title}
                        </p>
                        <p className="text-[color:var(--tone-dark)] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-[color:var(--tone-dark)] rounded-3xl p-8 bg-[color:var(--tone-dark)]/5">
              <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-[color:var(--tone-dark)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 mb-3 font-medium">
                    Current target
                  </p>
                  <p className="text-2xl font-bold text-[color:var(--tone-dark)]">
                    Polkadot Hub TestNet
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--tone-light)] bg-[color:var(--tone-dark)] rounded-full px-4 py-2 font-semibold">
                  x402
                </span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-3 px-4 bg-[color:var(--tone-light)]/50 rounded-lg border border-[color:var(--tone-border)]">
                  <span className="uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 text-xs font-medium">Chain id</span>
                  <span className="text-[color:var(--tone-dark)] font-semibold">420420422</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-[color:var(--tone-light)]/50 rounded-lg border border-[color:var(--tone-border)]">
                  <span className="uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 text-xs font-medium">Native</span>
                  <span className="text-[color:var(--tone-dark)] font-semibold">PAS · 18 decimals</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-[color:var(--tone-light)]/50 rounded-lg border border-[color:var(--tone-border)]">
                  <span className="uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 text-xs font-medium">RPC</span>
                  <span className="text-[color:var(--tone-dark)] font-semibold">passthrough RPC</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-[color:var(--tone-light)]/50 rounded-lg border border-[color:var(--tone-border)]">
                  <span className="uppercase tracking-[0.3em] text-[color:var(--tone-dark)]/60 text-xs font-medium">Custom</span>
                  <span className="text-[color:var(--tone-dark)] font-semibold">Env overrides available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-dark border-b border-[color:var(--tone-border)]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-20">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-muted)] mb-4">
              SDK
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold text-[color:var(--tone-light)] mb-6">
              Polkadot x402 SDK
            </h3>
            <p className="text-lg text-[color:var(--tone-muted)] max-w-3xl mx-auto">
              Complete SDK for Polkadot Hub TestNet (EVM-compatible). Facilitator endpoints for verification
              and settlement, client-side payment creation utilities, and axios interceptor for automatic
              402 response handling. Native PAS token transfers supported.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="mb-4">
                <svg className="w-8 h-8 text-[color:var(--tone-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[color:var(--tone-light)] mb-2">Facilitator Endpoints</h4>
              <p className="text-sm text-[color:var(--tone-muted)]">
                <code>/api/facilitator/verify</code>, <code>/api/facilitator/settle</code>, and <code>/api/facilitator/supported</code>.
                EIP-712 signature validation with deterministic verification results.
              </p>
            </div>
            <div className="card">
              <div className="mb-4">
                <svg className="w-8 h-8 text-[color:var(--tone-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[color:var(--tone-light)] mb-2">Client Utilities</h4>
              <p className="text-sm text-[color:var(--tone-muted)]">
                Server-side payment creation endpoint (<code>/api/demo/create-payment</code>) keeps private keys secure.
                Axios interceptor automatically handles 402 responses and retries with payment headers.
              </p>
            </div>
            <div className="card">
              <div className="mb-4">
                <svg className="w-8 h-8 text-[color:var(--tone-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[color:var(--tone-light)] mb-2">Native Token Support</h4>
              <p className="text-sm text-[color:var(--tone-muted)]">
                Native PAS token transfers on Polkadot Hub TestNet. Direct native token settlement without
                ERC-20 contract calls. ERC20 token support available via token address configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-dark border-b border-[color:var(--tone-border)]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-20">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-muted)]">Uptime</p>
              <h3 className="text-3xl font-semibold text-[color:var(--tone-light)]">
                Designed to stay invisible when healthy.
              </h3>
              <p className="text-[color:var(--tone-muted)]">
                No gradients, no clipart dashboards. Just a facilitator that answers, signs, and
                reports. Everything else belongs in your own monitoring stack.
              </p>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-muted)]">
                  Telemetry Snapshot
                </span>
                <span className="text-sm text-[color:var(--tone-light)]">Last 24h</span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[color:var(--tone-muted)]">Verifications</span>
                  <span className="text-[color:var(--tone-light)]">1,482</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--tone-muted)]">Settlements</span>
                  <span className="text-[color:var(--tone-light)]">1,104</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--tone-muted)]">Median latency</span>
                  <span className="text-[color:var(--tone-light)]">27 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--tone-muted)]">Failures</span>
                  <span className="text-[color:var(--tone-light)]">0.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-light">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--tone-dark)]/60 mb-6">
            Get Started
          </p>
          <h3 className="text-4xl font-semibold text-[color:var(--tone-dark)] mb-6">
            Everything lives in the docs. No guessing.
          </h3>
          <p className="text-lg text-[color:var(--tone-dark)]/80 mb-10">
            Complete x402 facilitator implementation for Polkadot Hub TestNet. API reference for facilitator endpoints,
            client-side payment utilities, and middleware configuration. See the demo for an end-to-end payment flow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/demo" className="btn btn-primary text-base">
              Try Demo
            </a>
            <a href="/docs" className="btn btn-primary text-base">
              Open documentation
            </a>
            <a href="/docs#api" className="btn btn-primary text-base">
              Jump to API
            </a>
          </div>
        </div>
      </section>
      </main>
  );
}
