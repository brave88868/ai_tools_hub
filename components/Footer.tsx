import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-6">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Tools Station</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              600+ AI tools for job seekers, creators, marketers, and businesses.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Toolkits</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/toolkits/jobseeker" className="hover:text-gray-900">Jobseeker</Link></li>
              <li><Link href="/toolkits/creator" className="hover:text-gray-900">Creator</Link></li>
              <li><Link href="/toolkits/marketing" className="hover:text-gray-900">Marketing</Link></li>
              <li><Link href="/toolkits/business" className="hover:text-gray-900">Business</Link></li>
              <li><Link href="/toolkits/legal" className="hover:text-gray-900">Legal</Link></li>
              <li><Link href="/toolkits" className="text-indigo-600 hover:text-indigo-800 font-medium">+ many more</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular AI Generators</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/ai-generators/resume" className="hover:text-gray-900">AI Resume Generator</Link></li>
              <li><Link href="/ai-generators/marketing-copy" className="hover:text-gray-900">AI Marketing Copy Generator</Link></li>
              <li><Link href="/ai-generators/business-plan" className="hover:text-gray-900">AI Business Plan Generator</Link></li>
              <li><Link href="/ai-generators/flashcard" className="hover:text-gray-900">AI Flashcard Generator</Link></li>
              <li><Link href="/ai-generators/email" className="hover:text-gray-900">AI Email Generator</Link></li>
              <li><Link href="/ai-generators/youtube-title" className="hover:text-gray-900">AI YouTube Title Generator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Product</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/toolkits" className="hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
              <li><Link href="/features" className="hover:text-gray-900">Feature Requests</Link></li>
              <li><Link href="/submit" className="hover:text-gray-900">Submit a Tool</Link></li>
              <li><Link href="/partners" className="hover:text-gray-900">Partner Program</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Resources</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/ai-generators" className="hover:text-gray-900">AI Generators</Link></li>
              <li><Link href="/compare/ai-resume-generator-vs-chatgpt" className="hover:text-gray-900">AI Tool Comparisons</Link></li>
              <li><Link href="/alternatives/jasper-ai-alternatives" className="hover:text-gray-900">AI Alternatives</Link></li>
              <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
              <li><Link href="/submit" className="hover:text-gray-900">Submit Tool</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Company</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/about" className="hover:text-gray-900">About Us</Link></li>
              <li><Link href="/trust" className="hover:text-gray-900">Trust & Security</Link></li>
              <li><Link href="/methodology" className="hover:text-gray-900">Methodology</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} AI Tools Station. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
