"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";
import {
  IconArrowRight,
  IconChart,
  IconEye,
  IconEyeOff,
  IconShield,
  IconSparkles,
} from "@/components/icons";

const DEMO_ACCOUNTS: Record<
  Role,
  { email: string; label: string; loginId: string }
> = {
  admin: { email: "admin@pilates-studio.app", label: "Admin", loginId: "admin" },
  instructor: {
    email: "neelamr@zenpilates.com",
    label: "Instructor",
    loginId: "neelamr",
  },
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.62.75 3.84 3.27 2.06 6.94l3.66 2.84C6.6 7.02 9.05 5.04 12 5.04Z"
      />
      <path
        fill="#4285F4"
        d="M23.25 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.32-5.17 3.32-8.82Z"
      />
      <path
        fill="#FBBC05"
        d="M5.72 14.22a7.2 7.2 0 0 1 0-4.44L2.06 6.94a11.26 11.26 0 0 0 0 10.12l3.66-2.84Z"
      />
      <path
        fill="#34A853"
        d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.86-3c-1.07.72-2.44 1.15-3.6 1.15-2.95 0-5.4-1.98-6.28-4.71l-3.66 2.84c1.78 3.67 5.56 6.44 11.94 6.44Z"
      />
    </svg>
  );
}

function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/logo-gold.png"
        alt="Pilates With Neelam"
        className="brand-logo-img"
      />
    </span>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const oauthError = searchParams.get("oauth_error");

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(oauthError ?? "");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    // Sync OAuth error from URL after SSR hydration (searchParams empty on server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (oauthError) setError(oauthError);
  }, [oauthError]);

  const selectRole = (r: Role) => {
    setRole(r);
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

  const handleGoogleSignIn = useCallback(async () => {
    setError("");
    setOauthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  }, [next]);

  return (
    <div className="auth-shell">
      {/* Ambient animated backdrop */}
      <div className="auth-backdrop" aria-hidden>
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
        <span className="auth-grain" />
      </div>

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
          <div className="auth-welcome-chip">
            <IconSparkles size={13} /> New here? Your first class starts with a
            2-minute AI assessment.
          </div>
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
            &quot;Pilates is the art of controlled motion. Let me guide your
            practice.&quot;
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <span className="abox">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M12 20s7-3.5 7-9V5.5L12 3 5 5.5V11c0 5.5 7 9 7 9Z" />
              </svg>
            </span>
            Pilates With Neelam
          </div>

          <div className="auth-card-head">
            <div className="eyebrow">Studio workspace</div>
            <h2>Welcome to your studio</h2>
            <p>Sign in to book classes, track progress and more</p>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading || loading}
          >
            {oauthLoading ? (
              <span className="login-loading">
                <span className="spinner" style={{ width: 16, height: 16 }} />{" "}
                Redirecting to Google…
              </span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <div className="auth-divider" role="separator">
            <span>or sign in with email</span>
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
                  <span className="spinner" style={{ width: 16, height: 16 }} />{" "}
                  Signing in…
                </span>
              ) : (
                <>
                  Sign In <IconArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footnote">
            New to the studio?{" "}
            <Link href="/#begin-journey" className="auth-journey-link">
              Start your personalized journey
            </Link>
          </p>
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
