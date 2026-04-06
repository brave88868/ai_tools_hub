import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AI Tools Station",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm text-gray-600 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
          <p>
            We collect information you provide directly (email address, name) and usage data
            (tools used, timestamps) to operate and improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
          <p>
            We use your information to provide the Service, process payments, enforce usage limits,
            and improve our products. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">3. Third-Party Services</h2>
          <p>
            We use the following third-party services, each with their own privacy policies:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Supabase — database and authentication</li>
            <li>Stripe — payment processing</li>
            <li>OpenAI / Anthropic — AI content generation</li>
            <li>Vercel — hosting and analytics</li>
            <li>Cloudflare — DDoS protection and CDN</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">4. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Usage logs are
            retained for up to 12 months. You may request deletion of your account at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">5. Cookies</h2>
          <p>
            We use cookies for authentication sessions. We do not use tracking cookies for
            advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To exercise
            these rights, contact us at{" "}
            <a href="mailto:support@aitoolsstation.com" className="text-gray-900 underline">
              support@aitoolsstation.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of
            significant changes via email or a notice on the Service.
          </p>
        </section>
      </div>
    </main>
  );
}
