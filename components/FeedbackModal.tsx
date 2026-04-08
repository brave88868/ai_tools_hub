"use client";

import { useState } from "react";

type FeedbackType = "bug" | "feature" | "improvement" | "general";

interface Props {
  toolSlug: string;
}

export default function FeedbackModal({ toolSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_slug: toolSlug,
          feedback_type: feedbackType,
          rating: rating || null,
          message: message || null,
          email: email || null,
        }),
      });
      setSubmitted(true);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setOpen(false);
    setSubmitted(false);
    setMessage("");
    setEmail("");
    setRating(0);
    setFeedbackType("general");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Was this helpful? Send Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🙏</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Thank you!</h3>
                <p className="text-sm text-gray-700 mb-4">Your feedback helps us improve.</p>
                <button onClick={reset} className="text-xs text-gray-500 underline">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Send Feedback</h3>
                  <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <p className="text-xs font-medium text-gray-800 mb-2">Type</p>
                    <div className="flex flex-wrap gap-3">
                      {(["bug", "feature", "improvement", "general"] as FeedbackType[]).map((t) => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="feedback_type"
                            value={t}
                            checked={feedbackType === t}
                            onChange={() => setFeedbackType(t)}
                            className="accent-black"
                          />
                          <span className="text-xs text-gray-800 capitalize">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <p className="text-xs font-medium text-gray-800 mb-2">Rating <span className="text-gray-600">(optional)</span></p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          className="text-2xl leading-none transition-colors text-yellow-400"
                        >
                          {star <= (hovered || rating) ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-medium text-gray-800 block mb-1">
                      Message <span className="text-gray-600">(optional)</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Tell us what you think..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-gray-800 block mb-1">
                      Email <span className="text-gray-600">(optional, for follow-up)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white text-sm py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Send Feedback"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
