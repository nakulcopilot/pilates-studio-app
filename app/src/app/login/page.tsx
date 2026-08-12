"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";
import { IconArrowRight, IconChart, IconEye, IconEyeOff, IconShield, IconSparkles } from "@/components/icons";

const DEMO_ACCOUNTS: Record<Role, { email: string; label: string; loginId: string }> = {
  admin: { email: "admin@pilates-studio.app", label: "Admin", loginId: "admin" },
  instructor: { email: "neelamr@zenpilates.com", label: "Instructor", loginId: "neelamr" },
  student: { email: "neha@email.com", label: "Student", loginId: "s1" },
};

const LOGIN_IDS: Record<string, string> = {
  admin: "admin@pilates-studio.app",
  neelamr: "neelamr@zenpilates.com",
  s1: "neha@email.com",
  s2: "kavita@email.com",
  s3: "meera@email.com",
  s4: "rohit@email.com",
  s5: "ananya@email.com",
  s6: "priyam@email.com",
  s7: "amitp@email.com",
  s8: "sneha@email.com",
  s9: "neelam@email.com",
};

function resolveEmail(value: string): string {
  const v = value.trim();
  if (v.includes("@")) return v;
  return LOGIN_IDS[v] ?? v;
}

function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <img src="/branding/logo-gold.png" alt="Pilates With Neelam" className="brand-logo-img" />
    </span>
  );
}

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

  const selectRole = (r: Role) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r].email);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: resolveEmail(email.trim()),
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
        <Image
          src="/neelam/neelam-hero.jpg"
          alt="Neelam — Pilates instructor"
          className="auth-brand-photo"
          fill
          priority
          sizes="55vw"
          unoptimized
        />
        <div className="auth-logo">
          <BrandMark />
          <span className="auth-brand-name">Pilates With Neelam</span>
        </div>
        <div className="auth-brand-inner">
          <h1>Strength begins with mindful movement.</h1>
          <p>
            Private and small-group pilates guided by Neelam — every class
            tailored to your body, your goals, and your rhythm.
          </p>
          <div className="auth-features">
            <span className="auth-feature">
              <IconSparkles size={15} /> Personalized cues
            </span>
            <span className="auth-feature">
              <IconChart size={15} /> Progress tracking
            </span>
            <span className="auth-feature">
              <IconShield size={15} /> Your privacy
            </span>
          </div>
          <div className="auth-quote">
            &quot;Pilates is the art of controlled motion. Let me guide your practice.&quot;
          </div>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <span className="abox">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M12 20s7-3.5 7-9V5.5L12 3 5 5.5V11c0 5.5 7 9 7 9Z" />
              </svg>
            </span>
            Pilates With Neelam
          </div>
          <div className="auth-card-head">
            <div className="eyebrow">Studio workspace</div>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your studio</p>
          </div>
          <div className="auth-tabs">
            {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`auth-tab ${role === r ? "active" : ""}`}
                onClick={() => selectRole(r)}
              >
                {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email or username</label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                placeholder={`${DEMO_ACCOUNTS[role].loginId} or ${DEMO_ACCOUNTS[role].email}`}
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
                  title={showPw ? "Hide password" : "Show password"}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                </button>
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="login-loading">
                  <span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…
                </span>
              ) : (
                <>
                  Sign In <IconArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <div className="auth-demo">
            <div className="auth-demo-title">Demo credentials</div>
            <div className="auth-demo-row">
              <span>Admin</span> <code>admin</code>
            </div>
            <div className="auth-demo-row">
              <span>Instructor</span> <code>neelamr</code>
            </div>
            <div className="auth-demo-row">
              <span>Students</span> <code>s1</code> … <code>s9</code>
            </div>
            <div className="auth-demo-note">
              Sign in with your username or email. Passwords are shared by your studio.
            </div>
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
