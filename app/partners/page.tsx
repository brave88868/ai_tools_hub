"use client";

import { useState } from "react";
import Link from "next/link";

const SITE_URL = "https://www.aitoolsstation.com";

const REQUIREMENTS = [
  "Your tool must be a genuine AI-powered product",
  "Website must be live and functional",
  "Content must be appropriate for a general audience",
  "You must disclose the partnership on your site",
  "Spam, misleading claims, or black-hat SEO tactics are not permitted",
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Submit Your Tool",
    description:
      "Fill out the partner submission form with your tool details and affiliate link.",
  },
  {
    step: "2",
    title: "Get Reviewed",
    description:
      "Our team reviews every submission within 2–3 business days. We check quality, relevance, and legitimacy.",
  },
  {
    step: "3",
    title: "Get Listed",
    description:
      "Approved tools are listed in our directory with your affiliate/partner link included.",
  },
  {
    step: "4",
    title: "Add Our Badge",
    description:
      'Display the "Featured on AI Tools Station" badge on your site to build trust with your visitors.',
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors font-medium"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function PartnersPage() {
  const badgeSrc = `${SITE_URL}/badge.svg`;
  const badgeHtml = `<a href="${SITE_URL}" target="_blank"><img src="${badgeSrc}" alt="Featured on AI Tools Station" width="200" height="54" /></a>`;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-white border-b border-gray-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Grow Together with AI Tools Station
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            List your AI tool in front of thousands of daily users. Get a featured badge, a
            do-follow backlink, and optional affiliate link placement — all free.
          </p>
          <Link
            href="/submit"
            className="inline-block bg-indigo-600 text-white font-medium px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Submit Your Tool →
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">How It Works</h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            Getting listed takes less than 5 minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Badge Section */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Partner Badge</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Once approved, display our badge on your site to let your users know you&apos;re
            featured on AI Tools Station.
          </p>

          {/* Badge Preview */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badge.svg"
              alt="Featured on AI Tools Station"
              width={200}
              height={54}
              className="drop-shadow-sm"
            />
          </div>

          {/* Embed Code */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Embed Code
              </span>
              <CopyButton text={badgeHtml} />
            </div>
            <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {badgeHtml}
            </pre>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Partner Requirements
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            We maintain quality standards to ensure a great experience for our users.
          </p>
          <ul className="space-y-3">
            {REQUIREMENTS.map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Terms Summary */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Partner Terms</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600 space-y-4">
            <p>
              <strong className="text-gray-800">Commission:</strong> 20% of first payment via your affiliate program.
            </p>
            <p>
              <strong className="text-gray-800">Listing:</strong> Approved tools are listed in our
              directory at no cost. AI Tools Station reserves the right to remove any listing at any
              time for quality or policy reasons.
            </p>
            <p>
              <strong className="text-gray-800">Affiliate Links:</strong> If you provide an
              affiliate or partner link, we will use it when linking to your tool from our directory
              pages. We do not guarantee any specific placement or traffic volume.
            </p>
            <p>
              <strong className="text-gray-800">Badge Usage:</strong> The "Featured on AI Tools
              Station" badge may only be used by approved partners. You must link the badge back to{" "}
              <a href={SITE_URL} className="text-indigo-600 hover:underline">
                aitoolsstation.com
              </a>
              .
            </p>
            <p>
              <strong className="text-gray-800">Accuracy:</strong> You are responsible for keeping
              your tool information accurate. Notify us at{" "}
              <a href="mailto:partners@aitoolsstation.com" className="text-indigo-600 hover:underline">
                partners@aitoolsstation.com
              </a>{" "}
              if your tool details change significantly.
            </p>
            <p>
              <strong className="text-gray-800">No Guarantee:</strong> Listing on AI Tools Station
              does not guarantee any specific traffic, revenue, or business outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Partner?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Submit your tool today. It&apos;s free and takes less than 5 minutes.
          </p>
          <Link
            href="/submit"
            className="inline-block bg-indigo-600 text-white font-medium px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Submit Your Tool →
          </Link>
        </div>
      </section>
    </div>
  );
}
