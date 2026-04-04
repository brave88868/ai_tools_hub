"use client";

interface Props {
  onClose: () => void;
  toolkitSlug?: string;
}

export default function UpgradeModal({ onClose, toolkitSlug }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            You&apos;ve used your 3 free generations
          </h2>
          <p className="text-gray-500 text-sm">
            Subscribe to continue using AI tools with unlimited generations.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <div className="text-2xl font-bold text-gray-900">
            $9<span className="text-sm font-normal text-gray-500">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Unlimited generations · Cancel anytime</div>
        </div>

        <div className="space-y-3">
          <a
            href={toolkitSlug ? `/pricing?toolkit=${toolkitSlug}` : "/pricing"}
            className="block w-full bg-black text-white text-center rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Subscribe Now
          </a>
          <button
            onClick={onClose}
            className="block w-full text-gray-500 text-center rounded-xl py-3 text-sm hover:text-gray-800 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
