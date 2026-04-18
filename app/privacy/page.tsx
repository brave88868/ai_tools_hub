import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
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
          <h2 className="text-base font-semibold text-gray-800 mb-2">4. Data Storage & Jurisdiction</h2>
          <p>
            Your data is stored on Supabase infrastructure hosted in{" "}
            <strong>AWS ap-southeast-2 (Sydney, Australia)</strong>.
            By using this service, you consent to your data being processed
            and stored in Australia.
          </p>
          <p className="mt-2">
            Payment data is processed by Stripe Inc. and subject to
            Stripe&apos;s Privacy Policy. AI generation requests are processed
            by OpenAI LLC (United States) and subject to OpenAI&apos;s usage policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">5. Data Retention</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Account data: retained while account is active + 90 days after deletion</li>
            <li>AI generation inputs/outputs: not stored beyond the session</li>
            <li>Usage logs: retained for 12 months for security purposes</li>
            <li>Payment records: retained for 7 years (legal requirement)</li>
          </ul>
          <p className="mt-2">
            To request deletion of your data, email:{" "}
            <a href="mailto:privacy@aitoolsstation.com" className="text-gray-900 underline">
              privacy@aitoolsstation.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">6. Cookies</h2>
          <p>
            We use cookies for authentication sessions. We do not use tracking cookies for
            advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">7. Australian Privacy Principles</h2>
          <p>
            AI Tools Station complies with the{" "}
            <strong>Australian Privacy Act 1988</strong> and the 13 Australian Privacy
            Principles (APPs). This includes:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Open and transparent management of personal information</li>
            <li>Anonymity and pseudonymity options where lawful</li>
            <li>Collection of only necessary personal information</li>
            <li>Right to access and correct your personal information</li>
            <li>Protection of personal information from misuse and disclosure</li>
          </ul>
          <p className="mt-2">
            To exercise your rights under the APP, contact us at:{" "}
            <a href="mailto:privacy@aitoolsstation.com" className="text-gray-900 underline">
              privacy@aitoolsstation.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">8. GDPR — European Users</h2>
          <p>
            If you are located in the European Economic Area (EEA), you have the following
            rights under the{" "}
            <strong>General Data Protection Regulation (GDPR)</strong>:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
            <li>Right to restriction of processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
          </ul>
          <p className="mt-2">
            Our legal basis for processing is{" "}
            <strong>legitimate interest</strong> (service delivery) and{" "}
            <strong>consent</strong> (marketing communications). To exercise GDPR rights,
            email:{" "}
            <a href="mailto:privacy@aitoolsstation.com" className="text-gray-900 underline">
              privacy@aitoolsstation.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">9. AI-Generated Content</h2>
          <p>
            AI Tools Station uses large language models (currently OpenAI GPT) to generate
            content. In accordance with the{" "}
            <strong>EU Artificial Intelligence Act</strong> and responsible AI principles:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>All AI-generated content is clearly labelled as AI-generated</li>
            <li>Users are responsible for reviewing content before professional use</li>
            <li>Our tools are classified as <strong>limited-risk AI systems</strong></li>
            <li>User inputs are not used to train AI models</li>
            <li>We do not make automated decisions that significantly affect users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">10. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To exercise
            these rights, contact us at{" "}
            <a href="mailto:privacy@aitoolsstation.com" className="text-gray-900 underline">
              privacy@aitoolsstation.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of
            significant changes via email or a notice on the Service.
          </p>
        </section>
      </div>
    </main>
  );
}
