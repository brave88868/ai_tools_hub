import { createAdminClient } from "@/lib/supabase";

export default async function OperatorFeedbackPage() {
  const admin = createAdminClient();

  const { data: feedbacks } = await admin
    .from("feedback")
    .select("id, tool_slug, feedback_type, rating, message, email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = feedbacks ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Feedback <span className="text-gray-400 font-normal text-base">({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No feedback yet.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Tool</th>
                  <th className="text-center px-3 py-3 font-medium">Rating</th>
                  <th className="text-center px-3 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Message</th>
                  <th className="text-right px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((fb) => (
                  <tr key={fb.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 text-xs">{fb.tool_slug ?? "—"}</td>
                    <td className="px-3 py-3 text-center text-xs">
                      {fb.rating ? (
                        <span className="text-yellow-500">{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                        {fb.feedback_type ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-xs">
                      <span className="line-clamp-2">{fb.message ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
