"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do I need to create an account?",
    a: "No. You can use any tool immediately without signing up. Anonymous users get 1 free use per day. Create a free account to get 3 uses/day and 30 lifetime uses across all tools.",
  },
  {
    q: "Can I use the tools for free?",
    a: "Yes! Every tool is free to try. Free accounts get 3 AI generations per day and 30 total uses — no credit card required. Upgrade to Pro for 100 uses/day and unlimited access.",
  },
  {
    q: "What AI model do you use?",
    a: "We use OpenAI's GPT-4o and GPT-4o-mini depending on the tool. All models are state-of-the-art and optimised for professional use cases, so you get accurate, high-quality outputs every time.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Your inputs are sent securely to the AI and are never stored or used to train models. We use SSL encryption for all data in transit. See our Privacy Policy for full details.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. There are no lock-ins. Cancel anytime from your Dashboard and you'll retain Pro access until the end of your billing period. No questions asked.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
        <p className="text-gray-700">Everything you need to know before getting started</p>
      </div>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
              <span className={`text-gray-400 transition-transform flex-shrink-0 ${open === i ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
