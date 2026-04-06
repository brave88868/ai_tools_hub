import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AI Tools Station",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm text-gray-600 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using AI Tools Station (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">2. Description of Service</h2>
          <p>
            AI Tools Station provides AI-powered productivity tools via subscription. We reserve the
            right to modify, suspend, or discontinue any part of the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">3. Subscriptions and Billing</h2>
          <p>
            Subscriptions are billed monthly. You may cancel at any time from your dashboard.
            Access continues until the end of the current billing period. No refunds are issued
            for unused portions of a billing period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">4. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any unlawful purpose, to generate harmful or
            misleading content, or to circumvent usage limits through automated means.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">5. Disclaimer</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. AI-generated content
            is for informational purposes only and does not constitute professional legal,
            financial, or medical advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, AI Tools Station shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">7. Contact</h2>
          <p>
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:support@aitoolsstation.com" className="text-gray-900 underline">
              support@aitoolsstation.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
