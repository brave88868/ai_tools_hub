# SPEC-06 — Authentication + Stripe Billing
# Phase 2: Supabase Auth + Stripe 订阅系统

## 断点恢复说明
如果中断，检查以下文件完成状态：
- app/login/LoginForm.tsx（Auth 逻辑）
- app/signup/SignupForm.tsx（Auth 逻辑）
- app/api/subscription/checkout/route.ts
- app/api/subscription/webhook/route.ts
- app/dashboard/page.tsx
- middleware.ts（保护路由）
从第一个未完成的继续。

---

## 前置确认
- [x] .env.local 已填入所有 Stripe Price ID
- [x] .env.local 已填入 STRIPE_WEBHOOK_SECRET
- [x] Supabase 项目存在，所有表已建好
- [x] lib/stripe.ts 有 TOOLKIT_PRICE_IDS 映射

---

## 目标
实现完整的用户认证 + 订阅付费系统：
1. Google OAuth + 邮箱密码登录注册
2. Stripe Checkout（per-toolkit + bundle）
3. Stripe Webhook 自动更新订阅状态
4. 用户 Dashboard 显示订阅和使用情况
5. middleware 保护需要登录的路由

---

## Step 6.0 — 安装依赖

```bash
npm install @supabase/ssr
```

---

## Step 6.1 — 更新 lib/supabase.ts

支持 server/client 两种用法，使用 @supabase/ssr：

```typescript
import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient, createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 浏览器客户端（客户端组件用）
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 服务端客户端（Server Components / API Routes 用）
export function createServerClient() {
  const cookieStore = cookies();
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// 管理员客户端（API Routes 用，绕过 RLS）
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

## Step 6.2 — 更新 middleware.ts

刷新 Supabase session，保护 /dashboard 路由：

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 保护 /dashboard 路由，未登录重定向到 /login
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
```

---

## Step 6.3 — 更新 app/login/LoginForm.tsx

实现真实 Auth 逻辑：

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to AI Tools Hub</h1>
      <p className="text-sm text-gray-400 mb-6">Subscribe to any toolkit and unlock unlimited generations.</p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-gray-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

---

## Step 6.4 — 更新 app/signup/SignupForm.tsx

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGoogleSignup() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-400">
          We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-400 mb-6">Start free — no credit card required.</p>

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSignup} className="space-y-3">
        <input type="email" placeholder="Email address" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        <input type="password" placeholder="Password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        <input type="password" placeholder="Confirm password" required value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        <button type="submit" disabled={loading}
          className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
```

---

## Step 6.5 — 创建 app/auth/callback/route.ts

处理 OAuth 回调：

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

---

## Step 6.6 — 实现 app/api/subscription/checkout/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { toolkit_slug } = await req.json();

    if (!toolkit_slug || !TOOLKIT_PRICE_IDS[toolkit_slug]) {
      return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: TOOLKIT_PRICE_IDS[toolkit_slug],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=${toolkit_slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        toolkit_slug,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
```

---

## Step 6.7 — 实现 app/api/subscription/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { user_id, toolkit_slug } = session.metadata;
    const subscription_id = session.subscription;

    // 获取订阅详情
    const sub = await stripe.subscriptions.retrieve(subscription_id);

    await supabase.from("subscriptions").upsert({
      user_id,
      toolkit_slug,
      stripe_subscription_id: subscription_id,
      stripe_customer_id: session.customer,
      status: "active",
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    }, { onConflict: "user_id,toolkit_slug" });

    // 记录 analytics
    await supabase.from("analytics_events").insert({
      event_type: "subscription_created",
      user_id,
      toolkit_slug,
    });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

    await supabase
      .from("subscriptions")
      .update({
        status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
```

---

## Step 6.8 — 实现 app/dashboard/page.tsx

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | AI Tools Hub",
};

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 加载订阅
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("toolkit_slug, status, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active");

  // 加载今日使用次数
  const today = new Date().toISOString().slice(0, 10);
  const { count: todayCount } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_date", today);

  const { count: totalCount } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isPaid = (subscriptions?.length ?? 0) > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's uses", value: todayCount ?? 0 },
          { label: "Total uses", value: totalCount ?? 0 },
          { label: "Plan", value: isPaid ? "Pro" : "Free" },
          { label: "Active subscriptions", value: subscriptions?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
        {(subscriptions?.length ?? 0) === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">No active subscriptions yet.</p>
            <Link href="/pricing" className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
              View Plans →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions!.map((sub) => (
              <div key={sub.toolkit_slug} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{sub.toolkit_slug} Toolkit</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Renews {new Date(sub.current_period_end).toLocaleDateString("en-AU")}
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Browse Tools", href: "/toolkits" },
          { label: "View Pricing", href: "/pricing" },
          { label: "Sign Out", href: "/auth/signout" },
        ].map(({ label, href }) => (
          <Link key={label} href={href}
            className="border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-600 hover:border-gray-400 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
```

---

## Step 6.9 — 创建 app/auth/signout/route.ts

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

## Step 6.10 — 更新 components/Header.tsx

Sign In 按钮检查登录状态，登录后显示 Dashboard：

在 Header 里加一个 useEffect 检查 session：

```typescript
// 在 Header 组件里添加
const [user, setUser] = useState<any>(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user));
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    setUser(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}, []);
```

然后把 Sign In 按钮改为：
```typescript
{user ? (
  <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
    Dashboard
  </Link>
) : (
  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
    Sign In
  </Link>
)}
```

---

## Step 6.11 — 更新 Supabase：开启 Google OAuth

在 Supabase Dashboard → Authentication → Providers → Google：
- 需要填入 Google OAuth Client ID 和 Secret
- 这一步由 Max 手动在 Supabase Dashboard 配置
- 在代码里不需要额外操作，signInWithOAuth 会自动处理

---

## 执行顺序

```
1. npm install @supabase/ssr
2. 更新 lib/supabase.ts
3. 更新 middleware.ts
4. 更新 app/login/LoginForm.tsx
5. 更新 app/signup/SignupForm.tsx
6. 创建 app/auth/callback/route.ts
7. 创建 app/auth/signout/route.ts
8. 实现 app/api/subscription/checkout/route.ts
9. 实现 app/api/subscription/webhook/route.ts
10. 实现 app/dashboard/page.tsx
11. 更新 components/Header.tsx（登录状态）
12. npm run type-check → 0 错误
13. 更新 PROJECT_CONTEXT.md，Phase 2 标记为 ✅
```

---

## 验证检查点

```
- http://localhost:3000/login → 显示 Google + 邮箱登录表单
- http://localhost:3000/signup → 显示注册表单
- http://localhost:3000/dashboard → 未登录自动跳转到 /login
- /api/subscription/checkout → POST {toolkit_slug: "jobseeker"} 返回 {url: "https://checkout.stripe.com/..."}
- /api/subscription/webhook → Stripe Webhook 事件正确更新 subscriptions 表
```

---

## 注意事项

1. Google OAuth 需要在 Supabase Dashboard 手动配置（Phase 2 完成后 Max 操作）
2. Stripe Webhook 在本地测试需要用 `stripe listen --forward-to localhost:3000/api/subscription/webhook`
3. 所有 Stripe 操作目前在 Sandbox 模式，上线前切换到 Live 账号
4. `createServerClient` 在 API Route 里调用需要 cookies()，确保是在 async 函数里
5. webhook route 需要原始 body（text），不能用 req.json()
