"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconChart, IconShield, IconSparkles } from "@/components/icons";

const STORAGE_KEY = "pwn_first_visit_journey_v1";

interface JourneyStep {
  eyebrow: string;
  title: string;
  body: string;
  visual: "welcome" | "neelam" | "flow" | "begin";
}

const STEPS: JourneyStep[] = [
  {
    eyebrow: "Welcome",
    title: "Your practice starts with you",
    body: "Not a generic class list — a studio that adapts to your body, your goals and your pace. Let us show you how, in under a minute.",
    visual: "welcome",
  },
  {
    eyebrow: "Meet your instructor",
    title: "Guided by Neelam, personally",
    body: "Small groups, private sessions and cues tailored to how you move today — never one-size-fits-all instruction.",
    visual: "neelam",
  },
  {
    eyebrow: "How it works",
    title: "Three steps to your first class",
    body: "1. A 2-minute AI assessment understands your level and needs. 2. We match you to the right class. 3. Book your spot — Neelam prepares before you arrive.",
    visual: "flow",
  },
  {
    eyebrow: "Ready when you are",
    title: "Begin your journey",
    body: "Start the assessment now — it takes two minutes, and your first recommended class is waiting right after.",
    visual: "begin",
  },
];

function StepVisual({ kind }: { kind: JourneyStep["visual"] }) {
  if (kind === "welcome") {
    return (
      <div className="fj-visual fj-welcome">
        <span className="fj-pulse" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/logo-gold.png" alt="" className="fj-logo" />
      </div>
    );
  }
  if (kind === "neelam") {
    return (
      <div className="fj-visual fj-neelam">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/neelam/neelam-hero.jpg" alt="Neelam" className="fj-photo" />
        <span className="fj-photo-glow" />
      </div>
    );
  }
  if (kind === "flow") {
    return (
      <div className="fj-visual fj-flow">
        {[
          { icon: IconSparkles, label: "AI Assessment", note: "2 minutes" },
          { icon: IconChart, label: "Class match", note: "Personalized" },
          { icon: IconArrowRight, label: "Book & move", note: "Anytime" },
        ].map(({ icon: Icon, label, note }, i) => (
          <div className="fj-flow-node" key={label} style={{ animationDelay: `${i * 0.15}s` }}>
            <span className="fj-flow-icon">
              <Icon size={18} />
            </span>
            <span className="fj-flow-label">{label}</span>
            <span className="fj-flow-note">{note}</span>
            {i < 2 && <span className="fj-flow-link" aria-hidden />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="fj-visual fj-begin">
      <IconShield size={22} />
      <p>No pressure. No payment. Just a practice that fits you.</p>
    </div>
  );
}

export default function FirstVisitJourney() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // First-visit detection must run post-hydration to avoid SSR mismatch.
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(!seen);
    } catch {
      // Storage unavailable — default to not showing.
    }
    setReady(true);
  }, []);

  const close = useCallback((markDone = true) => {
    setOpen(false);
    if (markDone) {
      try {
        window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      } catch {
        // Ignore storage failures.
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!ready || !open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fj-overlay" role="dialog" aria-modal="true" aria-label="Welcome journey">
      <div className="fj-backdrop" onClick={() => close()} aria-hidden />
      <div className={`fj-card fj-step-${current.visual}`}>
        <button
          type="button"
          className="fj-skip"
          onClick={() => close()}
          aria-label="Skip welcome journey"
        >
          Skip
        </button>

        <StepVisual kind={current.visual} />

        <div className="fj-content">
          <div className="fj-eyebrow">{current.eyebrow}</div>
          <h2 className="fj-title">{current.title}</h2>
          <p className="fj-body">{current.body}</p>

          {isLast && (
            <div className="fj-actions">
              <Link href="/assessment?from=journey" className="fj-cta" onClick={() => close()}>
                <IconSparkles size={16} /> Start AI assessment
              </Link>
              <Link href="/login" className="fj-secondary" onClick={() => close()}>
                Sign in
              </Link>
            </div>
          )}

          <div className="fj-footer">
            <div className="fj-dots" role="tablist" aria-label="Journey progress">
              {STEPS.map((s, i) => (
                <button
                  key={s.eyebrow}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  aria-label={`Step ${i + 1}: ${s.eyebrow}`}
                  className={`fj-dot ${i === step ? "active" : ""}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
            {!isLast ? (
              <button
                type="button"
                className="fj-next"
                onClick={() => setStep((s) => s + 1)}
              >
                Next <IconArrowRight size={14} />
              </button>
            ) : (
              <span className="fj-hint">Esc to close anytime</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
