import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string }>;
}

interface SaasProject {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  tagline: string | null;
  description: string | null;
  keyword: string | null;
  primary_tool_slug: string | null;
  seo_pages_count: number;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFeatureEmoji(index: number): string {
  const emojis = ["⚡", "🎯", "✨", "🔒", "📊", "🚀"];
  return emojis[index % emojis.length];
}

function getFeaturesTitle(name: string, keyword: string | null): string {
  const kw = (keyword ?? "").toLowerCase();
  if (kw.includes("generator")) return "What You Can Create";
  if (kw.includes("analyzer") || kw.includes("analyser")) return "What You Get";
  if (kw.includes("writer")) return "What You Can Write";
  return "Key Features";
}

function getTestimonials(name: string, keyword: string | null) {
  const kw = (keyword ?? name).toLowerCase();
  const isLegal = kw.includes("legal") || kw.includes("policy") || kw.includes("contract") || kw.includes("agreement");
  const isResume = kw.includes("resume") || kw.includes("cv") || kw.includes("career");
  const isContent = kw.includes("blog") || kw.includes("article") || kw.includes("content") || kw.includes("writer");
  const isMarketing = kw.includes("ad") || kw.includes("copy") || kw.includes("email") || kw.includes("marketing");

  if (isLegal) return [
    { text: `This saved me hours of legal work. Generated a compliant document in minutes!`, author: "Sarah K., Startup Founder" },
    { text: `Finally an AI tool that actually works for legal documents. Professional and accurate.`, author: "Marcus T., Small Business Owner" },
    { text: `Simple, fast, and professional results every time. Highly recommend.`, author: "Emma L., Freelancer" },
  ];
  if (isResume) return [
    { text: `Got 3 interviews in my first week after using this. My resume finally stands out.`, author: "James R., Software Engineer" },
    { text: `The AI optimized my resume perfectly for the roles I was targeting. Game changer.`, author: "Priya M., Marketing Manager" },
    { text: `Landed my dream job! This tool made my CV look so professional.`, author: "Tom B., Product Designer" },
  ];
  if (isContent) return [
    { text: `I write 5x more content now. The quality is consistently excellent.`, author: "Lisa H., Content Creator" },
    { text: `My blog traffic doubled after using this to optimize my articles.`, author: "David W., Blogger" },
    { text: `Fast, accurate, and sounds like a real human writer. Incredible tool.`, author: "Anya S., Freelance Writer" },
  ];
  if (isMarketing) return [
    { text: `Our conversion rate went up 40% after switching to AI-generated copy.`, author: "Chris P., Growth Marketer" },
    { text: `Saves me 10 hours a week on ad copy. The results speak for themselves.`, author: "Nina F., PPC Manager" },
    { text: `Best marketing AI tool I've used. Output is always on-brand and compelling.`, author: "Jake M., E-commerce Owner" },
  ];
  return [
    { text: `This tool completely transformed how I work. Results in seconds instead of hours.`, author: "Alex R., Entrepreneur" },
    { text: `Incredibly easy to use and the output quality is consistently impressive.`, author: "Morgan T., Small Business Owner" },
    { text: `I recommend this to everyone on my team. Saves us so much time every week.`, author: "Jordan K., Team Lead" },
  ];
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("saas_projects")
    .select("name, tagline, description, keyword")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = `${data.name} — Free AI Tool`;
  const description = data.tagline ?? `${data.name} powered by AI. Free to start, no credit card required.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SaasLandingPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data: project }, { data: toolkits }, { data: seoPages }] = await Promise.all([
    supabase
      .from("saas_projects")
      .select("id, name, slug, domain, tagline, description, keyword, primary_tool_slug, seo_pages_count, status")
      .eq("slug", slug)
      .single(),
    supabase
      .from("toolkits")
      .select("price_monthly")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true })
      .limit(1),
    supabase
      .from("seo_pages")
      .select("slug, title, seo_title")
      .eq("tool_slug", "")  // will be replaced below
      .eq("type", "saas_page")
      .limit(12),
  ]);

  if (!project) permanentRedirect("/saas");
  const p = project as SaasProject;

  // Fetch SEO pages with the correct tool slug
  const toolSlugForPages = p.primary_tool_slug ?? p.slug;
  const { data: relatedSeoPages } = await supabase
    .from("seo_pages")
    .select("slug, title, seo_title")
    .eq("tool_slug", toolSlugForPages)
    .eq("type", "saas_page")
    .limit(12);

  // Lowest Pro price from DB
  const lowestPrice = toolkits?.[0]?.price_monthly ?? 9;
  const priceDisplay = Number(lowestPrice) % 1 === 0
    ? String(Math.floor(Number(lowestPrice)))
    : String(Number(lowestPrice).toFixed(2));

  // Features
  const desc = p.description ?? "";
  const sentences = desc.split(/\.|\n/).map((s) => s.trim()).filter(Boolean);
  const features = [
    { title: "AI-Powered", body: sentences[0] ?? `${p.name} uses cutting-edge AI to deliver results instantly.` },
    { title: "Free to Start", body: "No credit card required. Start generating results in seconds with our free plan." },
    { title: "Professional Results", body: sentences[1] ?? `Optimized outputs that save you hours of manual work every week.` },
  ];

  // How It Works (default steps — meta column not in DB)
  const steps = [
    { title: "Enter Your Details", desc: "Fill in the simple form with your specific needs" },
    { title: "AI Generates Content", desc: "Our AI instantly creates professional results" },
    { title: "Copy & Use", desc: "Copy the output and use it immediately" },
  ];

  // FAQ (defaults)
  const faqs = [
    { q: "Is it free to use?", a: "Yes! Start for free with 3 uses per day. No credit card required." },
    { q: "How accurate is the AI output?", a: "Our AI is trained on professional templates and produces high-quality results instantly." },
    { q: "Can I use the output commercially?", a: "Yes, all content generated is yours to use for any purpose." },
    { q: "Do I need technical skills?", a: "No. Just fill in the form and get results in seconds." },
    { q: "How do I upgrade to Pro?", a: "Visit our pricing page to unlock unlimited generations." },
  ];

  // Testimonials
  const testimonials = getTestimonials(p.name, p.keyword);

  // Features title
  const featuresTitle = getFeaturesTitle(p.name, p.keyword);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.tagline ?? p.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: p.domain ? `https://${p.domain}` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1. Hero ── */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          {p.domain && (
            <p className="text-indigo-200 text-sm mb-3 font-mono">{p.domain}</p>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
            {p.name}
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            {p.tagline}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/toolkits"
              className="bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Try for Free →
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          {featuresTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, index) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{getFeatureEmoji(index)}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Testimonials ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-6 bg-gray-50 hover:border-indigo-200 transition-colors">
                <div className="text-yellow-400 mb-3 text-sm">★★★★★</div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs text-gray-500 font-semibold">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Pricing ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Simple Pricing</h2>
          <p className="text-gray-400 text-sm text-center mb-10">Start free, upgrade when you need more</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">$0</div>
                <p className="text-xs text-gray-400 mb-6">Forever free</p>
                <ul className="space-y-2.5 text-sm text-gray-500 mb-8">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> 3 uses per day</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> All core features</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> No credit card required</li>
                </ul>
              </div>
              <Link
                href="/toolkits"
                className="block text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors mt-auto"
              >
                Get Started Free
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 text-white rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Pro</h3>
                <div className="text-3xl font-extrabold mb-1">
                  ${priceDisplay}<span className="text-lg font-normal text-indigo-200">/mo</span>
                </div>
                <p className="text-xs text-indigo-300 mb-6">Billed monthly · Cancel anytime</p>
                <ul className="space-y-2.5 text-sm text-indigo-100 mb-8">
                  <li className="flex items-center gap-2"><span className="text-white font-bold">✓</span> Unlimited uses</li>
                  <li className="flex items-center gap-2"><span className="text-white font-bold">✓</span> All AI tools included</li>
                  <li className="flex items-center gap-2"><span className="text-white font-bold">✓</span> Priority support</li>
                  <li className="flex items-center gap-2"><span className="text-white font-bold">✓</span> Cancel anytime</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="block text-center bg-white text-indigo-700 font-semibold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors mt-auto"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-white hover:bg-gray-50 transition-colors list-none">
                <span className="font-medium text-gray-900 text-sm pr-4">{item.q}</span>
                <span className="text-gray-400 shrink-0 transition-transform group-open:rotate-180 text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 pt-2 bg-gray-50 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── 7. Learn More SEO Links ── */}
      {relatedSeoPages && relatedSeoPages.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Learn More</h2>
          <p className="text-gray-400 text-sm mb-6">Guides and resources powered by {p.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relatedSeoPages.map((page) => (
              <Link
                key={page.slug}
                href={`/use-cases/${page.slug}`}
                className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors line-clamp-1"
              >
                {page.seo_title ?? page.title ?? page.slug}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. Footer CTA ── */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-indigo-200 text-sm mb-8">
            Free forever · No credit card · Results in seconds
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/toolkits"
              className="bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Start Free →
            </Link>
            <Link
              href="/"
              className="text-white text-sm font-medium underline underline-offset-4 hover:text-indigo-200 transition-colors self-center"
            >
              Powered by AI Tools Station
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
