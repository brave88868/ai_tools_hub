"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  auto_generated: boolean;
  created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, published, auto_generated, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data as Post[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    setGenerating(true);
    setMsg("");
    const res = await fetch("/api/operator/generate-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 5 }),
    });
    const data = await res.json();
    setMsg(res.ok ? `✓ Generated ${data.generated} articles` : `✗ ${data.error ?? data.message}`);
    setGenerating(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post?")) return;
    setDeleting(id);
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  async function handleTogglePublish(post: Post) {
    await supabase.from("blog_posts").update({ published: !post.published }).eq("id", post.id);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !post.published } : p));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Blog Engine</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {generating ? "Generating…" : "Generate 5 Articles"}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No blog posts yet.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-center px-3 py-3 font-medium">Published</th>
                <th className="text-center px-3 py-3 font-medium">Auto</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{post.title}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={`text-xs px-2 py-0.5 rounded-full ${post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {post.published ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-gray-400">{post.auto_generated ? "AI" : "—"}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
