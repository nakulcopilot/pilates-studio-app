"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";

const DEMO_ACCOUNTS: Record<Role, { email: string; label: string }> = {
  admin: { email: "admin@pilates-studio.app", label: "Admin" },
  instructor: { email: "neelamr@zenpilates.com", label: "Instructor" },
  student: { email: "neha@email.com", label: "Student" },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState(DEMO_ACCOUNTS.admin.email);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(DEMO_ACCOUNTS[role].email);
  }, [role]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    },
    [email, password, next, router],
  );

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">🧘</div>
          <div className="auth-brand-name">
            Pilates<span>Studio</span>
          </div>
          <h1>AI-Enhanced Pilates Studio</h1>
          <p>
            Movement intelligence powered by instructor observations. No
            cameras. No wearables. Your studio, supercharged.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span>🤖</span> AI Cues
            </div>
            <div className="auth-feature">
              <span>📊</span> Progress
            </div>
            <div className="auth-feature">
              <span>🔒</span> Private
            </div>
          </div>
          <div className="auth-quote">
            &quot;AI reinforces your expertise — it never replaces it.&quot;
          </div>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <span className="abox">🧘</span> Pilates Studio
          </div>
          <div className="auth-live-badge">
            <span className="dot" />
            Live — Supabase
          </div>
          <div className="auth-card-head">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your workspace</p>
          </div>
          <div className="auth-tabs">
            {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`auth-tab ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-pw">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  title="Show password"
                  aria-label="Show password"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in…" : <>Sign In <span>→</span></>}
            </button>
          </form>
          <div className="auth-footer-note">
            Live build — data stored in PostgreSQL (Supabase). Demo credentials
            for each role are pre-filled; ask for the passwords.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
