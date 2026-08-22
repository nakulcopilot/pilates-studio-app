"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export interface AssessmentQuestion {
  id: string;
  text: string;
  options?: string[];
  numeric?: boolean;
  /** Free-form input kinds rendered instead of option cards. */
  input?: "text" | "tel" | "location";
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface AssessmentResult {
  level: "beginner" | "intermediate" | "advanced";
  focusAreas: string[];
  recommendedClasses: string[];
  assessmentSummary: string;
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q0",
    text: "First things first — what should we call you?",
    input: "text",
    placeholder: "Your name",
  },
  {
    id: "q1",
    text: "How would you describe your Pilates experience?",
    options: ["Complete beginner", "Some experience (have tried a few classes)", "Intermediate (regular practice)", "Advanced (extensive experience)"],
  },
  {
    id: "q2",
    text: "What is your primary goal with Pilates?",
    options: ["Improve flexibility", "Build core strength", "Rehabilitation/injury recovery", "General fitness and wellness", "Athletic performance"],
  },
  {
    id: "q3",
    text: "How often can you commit to Pilates classes per week?",
    options: ["1 class per week", "2-3 classes per week", "4+ classes per week", "Flexible - whenever I can"],
  },
  {
    id: "q4",
    text: "Do you have any existing injuries or physical limitations?",
    options: ["No injuries or limitations", "Minor discomfort (e.g., tight hips, sore back)", "Moderate injury (requires modification)", "Significant limitation (chronic condition)"],
  },
  {
    id: "q5",
    text: "Which Pilates equipment are you most interested in?",
    options: ["Mat only", "Reformer", "Cadillac/Wunda Chair", "All equipment"],
  },
  {
    id: "q6",
    text: "Rate your current fitness level from 0 (beginner) to 10 (advanced).",
    numeric: true,
    min: 0,
    max: 10,
  },
  {
    id: "q7",
    text: "What is your age range?",
    options: ["Under 25", "25-40", "41-60", "Over 60"],
  },
  {
    id: "q8",
    text: "Where are you based?",
    input: "location",
    placeholder: "City or area (e.g., Bandra, Mumbai)",
  },
  {
    id: "q9",
    text: "What's your WhatsApp number?",
    input: "tel",
    placeholder: "98765 43210",
  },
  {
    id: "q10",
    text: "May we message you on WhatsApp?",
    options: ["Yes, share my plan & class updates", "No messages, please"],
  },
];

/* ---------- Minimal line icons for option cards ---------- */

type IconName =
  | "sprout"
  | "leaf"
  | "waves"
  | "flame"
  | "feather"
  | "core"
  | "heartPulse"
  | "sun"
  | "zap"
  | "calendar"
  | "calendarRange"
  | "layers"
  | "clock"
  | "shieldCheck"
  | "activity"
  | "cross"
  | "lifeBuoy"
  | "mat"
  | "reformer"
  | "chair"
  | "grid"
  | "sparkles"
  | "bloom"
  | "moon"
  | "pin"
  | "phone"
  | "message"
  | "bellOff"
  | "users"
  | "home"
  | "calendarX";

const ICON_PATHS: Record<IconName, string[]> = {
  sprout: ["M12 21v-8", "M12 13C12 9.7 9.7 7.4 6.2 7.4c0 3.3 2.3 5.6 5.8 5.6z", "M12 11.4c0-3 2.2-5.1 5.4-5.1 0 3-2.2 5.1-5.4 5.1z"],
  leaf: ["M6.5 20.5C6.5 12 11 7 18.5 6c-.9 7.8-4.6 13-12 14.5z", "M6.5 20.5C9.5 15.5 13 12 17 9.5"],
  waves: ["M3 8c2.3 0 2.3 1.8 4.5 1.8S9.8 8 12 8s2.3 1.8 4.5 1.8S18.8 8 21 8", "M3 13c2.3 0 2.3 1.8 4.5 1.8S9.8 13 12 13s2.3 1.8 4.5 1.8 2.3-1.8 4.5-1.8", "M3 18c2.3 0 2.3 1.8 4.5 1.8S9.8 18 12 18s2.3 1.8 4.5 1.8 2.3-1.8 4.5-1.8"],
  flame: ["M12 3c.8 2.8 4.8 4.8 4.8 9.5a4.8 4.8 0 0 1-9.6 0c0-2.6 1.6-4.4 2.6-6.2.5 1.7 1.3 2.7 2.2 3.7.9-1.9.8-4.7 0-7z"],
  feather: ["M19 5.2c-3.8-2.3-8.6-.8-11.5 3l7.3 7.3c3.8-2.9 6.5-7 4.2-10.3z", "M6.5 20.5 14 9.5"],
  core: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M12 11.4a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2z"],
  heartPulse: ["M12 20S4 15 4 9.5A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 8 2.5c0 5.5-8 10.5-8 10.5z", "M6 12h3l1.5-2.5L12.5 14l1.5-2H18"],
  sun: ["M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M18.4 5.6l-1.3 1.3M6.9 17.1l-1.3 1.3"],
  zap: ["M13 2 5 13.5h6L11 22l8-11.5h-6L13 2z"],
  calendar: ["M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5z", "M3.5 10h17", "M8 3v4M16 3v4", "M7.5 14h3"],
  calendarRange: ["M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5z", "M3.5 10h17", "M8 3v4M16 3v4", "M7.5 13.5h4v4h-4zM14.5 13.5h2M14.5 17.5h2"],
  layers: ["M12 3.5 21 8l-9 4.5L3 8l9-4.5z", "M3 12.5l9 4.5 9-4.5", "M3 17l9 4.5L21 17"],
  clock: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M12 7.5V12l3 2"],
  shieldCheck: ["M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3z", "M9 12l2.2 2.2L15.5 10"],
  activity: ["M3 12h4l2.5-7 4.5 14 2.5-7H21"],
  cross: ["M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4z"],
  lifeBuoy: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z", "M6.2 6.2l3.6 3.6M14.2 14.2l3.6 3.6M17.8 6.2l-3.6 3.6M9.8 14.2l-3.6 3.6"],
  mat: ["M4 13.5h16a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-3A1.5 1.5 0 0 1 4 13.5z", "M6 13.5V11a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 11v2.5"],
  reformer: ["M3.5 16.5h17", "M5 16.5V13a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 13v3.5", "M7 11.5V8h10v3.5", "M12 8V5.5"],
  chair: ["M6.5 11V5A1.5 1.5 0 0 1 8 3.5h8A1.5 1.5 0 0 1 17.5 5v6", "M5 11h14a1 1 0 0 1 1 1v3.5H4V12a1 1 0 0 1 1-1z", "M5.5 15.5V20M18.5 15.5V20"],
  grid: ["M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
  sparkles: ["M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"],
  bloom: ["M12 12c-2.5-1-4-3.2-4-5.8C8 4 9.8 3 12 3s4 1 4 3.2c0 2.6-1.5 4.6-4 5.8z", "M12 12c2.5-1 5-.6 6.7 1.1 1.6 1.6 1.3 3.6-.4 4.9-2.2 1.6-4.8.8-6.3-1.5z", "M12 12c-2.5 1-4 3.2-3.7 5.8.2 2.2 2 3.1 4.1 2.5 2.6-.8 3.7-3.2 3.1-5.8z", "M12 12v9"],
  moon: ["M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z"],
  pin: ["M12 21s-6.5-5.3-6.5-10a6.5 6.5 0 1 1 13 0c0 4.7-6.5 10-6.5 10z", "M12 8.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z"],
  phone: ["M7 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3A2 2 0 0 1 18.4 19 15.4 15.4 0 0 1 5 5.6 2 2 0 0 1 7 3.5z"],
  message: ["M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H12l-4.5 4v-4H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z", "M7.5 10.5h9"],
  bellOff: ["M6 9a6 6 0 0 1 9.3-5M18 10.5V13l1.5 3H8", "M4 4l16 16", "M10 19a2 2 0 0 0 4 0"],
  users: ["M9.5 11a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 9.5 11z", "M2.8 20c0-3.7 3-6.2 6.7-6.2s6.7,2.5,6.7,6.2", "M16.4 11.4a3.6 3.6 0 0 0 0-7.1", "M17.6 14.2c2.2.7 3.7 2.5 3.7 5.1"],
  home: ["M4 11.5 12 4l8 7.5", "M6 10v9.5h12V10", "M10 19.5v-5h4v5"],
  calendarX: ["M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5z", "M3.5 10h17", "M8 3v4M16 3v4", "M9.8 13.3l4.4 4.4M14.2 13.3l-4.4 4.4"],
};

function OptionIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {ICON_PATHS[name].map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const OPTION_ICONS: Record<string, IconName> = {
  "Complete beginner": "sprout",
  "Some experience (have tried a few classes)": "leaf",
  "Intermediate (regular practice)": "waves",
  "Advanced (extensive experience)": "flame",
  "Improve flexibility": "feather",
  "Build core strength": "core",
  "Rehabilitation/injury recovery": "heartPulse",
  "General fitness and wellness": "sun",
  "Athletic performance": "zap",
  "1 class per week": "calendar",
  "2-3 classes per week": "calendarRange",
  "4+ classes per week": "layers",
  "Flexible - whenever I can": "clock",
  "No injuries or limitations": "shieldCheck",
  "Minor discomfort (e.g., tight hips, sore back)": "activity",
  "Moderate injury (requires modification)": "cross",
  "Significant limitation (chronic condition)": "lifeBuoy",
  "Mat only": "mat",
  Reformer: "reformer",
  "Cadillac/Wunda Chair": "chair",
  "All equipment": "grid",
  "Under 25": "sparkles",
  "25-40": "sun",
  "41-60": "bloom",
  "Over 60": "moon",
  "Yes, share my plan & class updates": "message",
  "No messages, please": "bellOff",
};

/* ---------- AI companion messages ---------- */

const COMPANION_MESSAGES = [
  "We're tailoring your perfect class in real time…",
  "Every answer sharpens your personal plan…",
  "Neelam's AI is sketching your ideal flow…",
  "Beautiful — your journey is taking shape…",
];

const ANALYZING_MESSAGES = [
  "Reading your movement DNA…",
  "Blending strength, mobility & calm…",
  "Selecting classes you'll love…",
];

const TOTAL = ASSESSMENT_QUESTIONS.length;
const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/* ---------- Contact-field helpers (module scope: pure) ---------- */

const PHONE_RE = /^[6-9]\d{9}$/;

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

function isValidAnswer(q: AssessmentQuestion, value: string | number | undefined): boolean {
  if (value === undefined || String(value).trim() === "") return false;
  if (q.input === "tel") return PHONE_RE.test(normalizePhone(String(value)));
  if (q.input === "location" || q.input === "text") return String(value).trim().length >= 2;
  return true;
}

type LocationStatus = "idle" | "locating" | "done" | "error";

/* One-tap location capture with graceful manual fallback. */
function LocationField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [status, setStatus] = useState<LocationStatus>("idle");

  const detect = () => {
    if (!navigator.geolocation || status === "locating") return;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let place = `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
        try {
          const controller = new AbortController();
          const abortTimer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`,
            { signal: controller.signal }
          );
          clearTimeout(abortTimer);
          if (res.ok) {
            const data = await res.json();
            place =
              [data.locality, data.principalSubdivision].filter(Boolean).join(", ") || place;
          }
        } catch {
          /* keep coordinates as fallback */
        }
        onChange(place);
        setStatus("done");
      },
      () => setStatus("error"),
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  return (
    <div className="asx-input-block">
      <div className="asx-input-shell">
        <span className="asx-input-icon">
          <OptionIcon name="pin" />
        </span>
        <input
          type="text"
          className="asx-input-field"
          value={value ?? ""}
          placeholder="City or area (e.g., Bandra, Mumbai)"
          autoComplete="address-level2"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="asx-input-actions">
        <button type="button" className="asx-detect-btn" onClick={detect} disabled={status === "locating"}>
          <OptionIcon name="pin" />
          {status === "locating" ? "Detecting…" : "Use my current location"}
        </button>
        {status === "done" && <span className="asx-input-status ok">Location captured</span>}
        {status === "error" && (
          <span className="asx-input-status err">Couldn&apos;t detect — please type your city</span>
        )}
      </div>
      <p className="asx-input-note">Helps us match studio sessions and timing near you.</p>
    </div>
  );
}

/* WhatsApp capture: +91 prefixed, 10-digit validation. */
function PhoneField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="asx-input-block">
      <div className="asx-input-shell">
        <span className="asx-input-icon">
          <OptionIcon name="phone" />
        </span>
        <span className="asx-input-prefix">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          className="asx-input-field"
          value={value ?? ""}
          placeholder="98765 43210"
          autoComplete="tel-national"
          maxLength={13}
          onChange={(e) => onChange(normalizePhone(e.target.value))}
        />
        {value !== undefined && value !== "" && (
          <span className={`asx-input-valid${PHONE_RE.test(String(value)) ? " ok" : ""}`}>
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M4.5 12.5l5 5L19.5 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
      {!PHONE_RE.test(value ? String(value) : "") && (
        <p className="asx-input-note">Enter the 10-digit mobile number linked to WhatsApp.</p>
      )}
    </div>
  );
}

/* Journey-completion guarantees: persistence must never block progress. */
const PERSIST_TIMEOUT_MS = 6000; // give up saving after 6s
const MIN_ANALYZING_MS = 900; // keep the reveal moment intentional

function withTimeout(task: Promise<void>, ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    task.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      () => {
        clearTimeout(timer);
        resolve();
      }
    );
  });
}

/* ---------- Demo sessions (post-assessment results) ---------- */

interface DemoSession {
  id: string;
  date: string;
  time: string;
  duration: number;
  max_students: number;
  enrolled: string[];
}

type DemoStatus = "loading" | "ready";
type RegistrationOutcome = "confirmed" | "requested" | "full";

const DEMOS_TIMEOUT_MS = 5000;
const REGISTER_TIMEOUT_MS = 8000;

function withTimeoutValue<T>(task: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

function formatDemoDate(iso: string): { day: string; dayNum: string; month: string } {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "", dayNum: "", month: "" };
  return {
    day: d.toLocaleDateString("en-IN", { weekday: "short" }),
    dayNum: String(d.getDate()),
    month: d.toLocaleDateString("en-IN", { month: "short" }),
  };
}

function formatDemoTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

export default function AssessmentModal({
  onComplete,
  onClose,
}: {
  onComplete: (result: AssessmentResult) => void;
  onClose: () => void;
}) {
  const router = useRouter();

  /* Supabase is optional at runtime: a missing/misconfigured env must never
     crash the journey. Persistence failures are logged and skipped. */
  const [supabase] = useState(() => {
    try {
      return createClient();
    } catch (err) {
      console.error("Supabase unavailable:", err);
      return null;
    }
  });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [phase, setPhase] = useState<"questions" | "analyzing" | "results">("questions");
  const [companionIndex, setCompanionIndex] = useState(0);
  const [analyzingIndex, setAnalyzingIndex] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);
  const studentIdRef = useRef<string | null>(null);

  /* Post-assessment demo sessions */
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("loading");
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, RegistrationOutcome>>({});
  const [resultSummary, setResultSummary] = useState<AssessmentResult | null>(null);

  const question = ASSESSMENT_QUESTIONS[step];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.min(answeredCount / TOTAL, 1);
  const hasAnsweredCurrent = isValidAnswer(question, answers[question.id]);
  const isFinalStep = step === TOTAL - 1;

  useEffect(() => {
    if (phase !== "questions") return;
    const interval = setInterval(() => {
      setCompanionIndex((prev) => (prev + 1) % COMPANION_MESSAGES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const interval = setInterval(() => {
      setAnalyzingIndex((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    []
  );

  const handleAnswer = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const advanceStep = () => {
    clearAdvanceTimer();
    setStep((prev) => Math.min(prev + 1, TOTAL - 1));
  };

  /* Auto-advance after a selection so the journey flows like a conversation */
  const selectOption = (option: string) => {
    handleAnswer(question.id, option);
    if (!isFinalStep) {
      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        setStep((currentStep) =>
          currentStep === step ? Math.min(step + 1, TOTAL - 1) : currentStep
        );
      }, 480);
    }
  };

  const goBack = () => {
    clearAdvanceTimer();
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const goToFirstUnanswered = () => {
    const firstInvalid = ASSESSMENT_QUESTIONS.findIndex(
      (q) => !isValidAnswer(q, answers[q.id])
    );
    if (firstInvalid >= 0) {
      clearAdvanceTimer();
      setStep(firstInvalid);
    }
  };

  /* ---------- Scoring logic (unchanged behaviour) ---------- */

  const classifyLevel = (allAnswers: Record<string, string | number>): "beginner" | "intermediate" | "advanced" => {
    const q1 = String(allAnswers.q1 ?? "");
    const q4 = String(allAnswers.q4 ?? "");
    const q6 = allAnswers.q6 === undefined ? NaN : Number(allAnswers.q6);

    const isAdvanced = q1.includes("advanced") || q6 >= 8;
    const isBeginner = q1.includes("beginner") || q6 <= 2 || q4.includes("significant");

    if (isAdvanced) return "advanced";
    if (isBeginner) return "beginner";
    return "intermediate";
  };

  const determineFocusAreas = (allAnswers: Record<string, string | number>): string[] => {
    const areas: string[] = [];
    const q2 = String(allAnswers.q2 ?? "");
    const q4 = String(allAnswers.q4 ?? "");
    const q5 = String(allAnswers.q5 ?? "");

    if (q2.includes("flexibility") || q5 === "Mat only") {
      areas.push("flexibility");
    }
    if (q2.includes("core") || q2.includes("strength")) {
      areas.push("core");
    }
    if (q2.includes("rehabilitation") || q4.includes("injury")) {
      areas.push("modifications");
    }
    if (q5 === "Reformer") {
      areas.push("machine-work");
    }
    if (q2.includes("wellness") || q2.includes("general fitness")) {
      areas.push("balanced-practice");
    }

    return areas.length > 0 ? areas : ["general"];
  };

  const getRecommendations = (
    level: "beginner" | "intermediate" | "advanced",
    focusAreas: string[]
  ): string[] => {
    const base: string[] = [];

    if (level === "beginner") {
      base.push("mat-basics");
      if (focusAreas.includes("core")) base.push("core-conditioning");
      if (focusAreas.includes("flexibility")) base.push("stretching");
    } else if (level === "intermediate") {
      base.push("reformer", "mat-intermediate");
      if (focusAreas.includes("core")) base.push("core-conditioning");
      if (focusAreas.includes("modifications")) base.push("injury-aware");
    } else {
      base.push("advanced-reformer", "mat-advanced");
      if (focusAreas.includes("core")) base.push("core-conditioning-advanced");
    }

    focusAreas.forEach((area) => {
      if (!base.includes(area)) {
        base.push(area);
      }
    });

    return base;
  };

  const generateAssessmentSummary = (
    level: "beginner" | "intermediate" | "advanced",
    focusAreas: string[]
  ): string => {
    const levelLabels: Record<string, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    };

    const focusStr = focusAreas.join(" and ");
    return `You're classified as ${levelLabels[level]}. Your focus areas are: ${focusStr}. Based on your responses, we recommend classes matching your level and goals.`;
  };

  const submitAssessment = async () => {
    if (submittedRef.current) return;
    const allValid = ASSESSMENT_QUESTIONS.every((q) => isValidAnswer(q, answers[q.id]));
    if (answeredCount < TOTAL || !allValid) {
      goToFirstUnanswered();
      return;
    }

    submittedRef.current = true;
    setPhase("analyzing");

    const level = classifyLevel(answers);
    const focusAreas = determineFocusAreas(answers);
    const recommendedClasses = getRecommendations(level, focusAreas);
    const summary = generateAssessmentSummary(level, focusAreas);

    const result: AssessmentResult = {
      level,
      focusAreas,
      recommendedClasses,
      assessmentSummary: summary,
    };

    // Persist + reveal run in parallel:
    // - persistence gives up after PERSIST_TIMEOUT_MS (paused project / bad network)
    // - the overlay stays up at least MIN_ANALYZING_MS so completion never feels abrupt
    try {
      await Promise.all([
        withTimeout(
          (async () => {
            if (!supabase) return;
            const { data: authData } = await supabase.auth.getUser();
            const { error } = await supabase
              .from("ai_assessment_results")
              .insert({
                user_id: authData?.user?.id || "temp",
                responses: answers,
                level,
                focus_areas: focusAreas,
                recommended_classes: recommendedClasses,
                created_at: new Date().toISOString(),
              });

            if (error) console.error("DB insert error:", error);
          })(),
          PERSIST_TIMEOUT_MS
        ),
        // Create/update the visitor's student record (authenticated users),
        // so they can self-enroll in a demo session right on the results screen.
        withTimeout(provisionStudent(level), PERSIST_TIMEOUT_MS),
        new Promise((resolve) => setTimeout(resolve, MIN_ANALYZING_MS)),
      ]);
    } catch (err) {
      console.error("Assessment save error:", err);
    }

    // Navigation is owned by the results screen inside this component.
    try {
      onComplete(result);
    } catch (err) {
      console.error("Assessment completion handler failed:", err);
    }

    setResultSummary(result);
    setPhase("results");
    loadDemos();
  };

  /* ---------- Post-assessment demo sessions ---------- */

  const provisionStudent = async (level: "beginner" | "intermediate" | "advanced") => {
    if (!supabase) return;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return; // guests stay in request-mode on the roster
      const { data, error } = await supabase.rpc("provision_student_from_assessment", {
        p_name: String(answers.q0 ?? "").trim(),
        p_phone: normalizePhone(String(answers.q9 ?? "")) || null,
        p_level: level,
      });
      if (error) {
        console.error("Student provisioning failed:", error);
        return;
      }
      if (typeof data === "string" && data) studentIdRef.current = data;
    } catch (err) {
      console.error("Student provisioning failed:", err);
    }
  };

  const loadDemos = async () => {
    setDemoStatus("loading");
    const load = (async (): Promise<DemoSession[]> => {
      if (!supabase) return [];
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("demo_sessions")
        .select("id, date, time, duration, max_students, enrolled")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as DemoSession[];
    })();
    // A failed/hung load resolves to an empty list → graceful "no demos" state.
    const upcoming = await withTimeoutValue(load, DEMOS_TIMEOUT_MS, [] as DemoSession[]);
    setDemos(upcoming);
    setDemoStatus("ready");
  };

  const resolveRegistration = async (demo: DemoSession): Promise<RegistrationOutcome> => {
    if (!supabase) return "requested";
    let studentId: string | null = studentIdRef.current;
    try {
      if (!studentId) {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id ?? null;

        if (uid) {
          // Provision on demand in case the completion-time call failed.
          await provisionStudent(classifyLevel(answers));
          studentId = studentIdRef.current;
        }
        if (!studentId && uid) {
          const { data: linked } = await supabase
            .from("students")
            .select("id")
            .eq("profile_user_id", uid)
            .maybeSingle();
          studentId = linked?.id ?? null;
        }
      }
      if (!studentId) {
        // Guest fallback: match the captured WhatsApp number against the roster.
        const digits = normalizePhone(String(answers.q9 ?? ""));
        if (digits.length === 10) {
          const { data: roster } = await supabase.from("students").select("id, phone").limit(200);
          const hit = (roster ?? []).find(
            (s) => normalizePhone(String(s.phone ?? "")) === digits
          );
          studentId = hit?.id ?? null;
        }
      }
      if (studentId) {
        const { data: code, error } = await supabase.rpc("enroll_in_demo", {
          p_demo_id: demo.id,
          p_student_id: studentId,
        });
        if (!error) {
          if (code === "enrolled" || code === "already_enrolled") return "confirmed";
          if (code === "full") return "full";
        }
      }
    } catch (err) {
      console.error("Registration failed:", err);
    }
    // Guests / unlinked accounts: record the request so staff can follow up.
    try {
      localStorage.setItem(
        "asx_demo_request",
        JSON.stringify({
          demoId: demo.id,
          date: demo.date,
          time: demo.time,
          phone: answers.q9 ?? null,
          location: answers.q8 ?? null,
          consent: answers.q10 === "Yes, share my plan & class updates",
          at: new Date().toISOString(),
        })
      );
    } catch {}
    return "requested";
  };

  const registerForDemo = async (demo: DemoSession) => {
    if (registeringId || registrations[demo.id] !== undefined) return;
    setRegisteringId(demo.id);
    const outcome = await withTimeoutValue(resolveRegistration(demo), REGISTER_TIMEOUT_MS, "requested");
    setRegistrations((prev) => ({ ...prev, [demo.id]: outcome }));
    setRegisteringId(null);
  };

  /* ---------- Analyzing overlay ---------- */

  if (phase === "analyzing") {
    return (
      <div className="asx-shell">
        <div className="asx-backdrop" aria-hidden="true">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
          <div className="auth-grain" />
        </div>
        <div className="asx-analyzing" role="status" aria-live="polite">
          <div className="asx-analyzing-rings">
            <span className="asx-ring-pulse" />
            <span className="asx-ring-pulse asx-ring-pulse-delay" />
            <div className="asx-analyzing-core">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" fill="currentColor" />
                <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill="currentColor" opacity=".55" />
              </svg>
            </div>
          </div>
          <p className="asx-analyzing-title">Crafting your perfect class</p>
          <p key={analyzingIndex} className="asx-analyzing-msg">
            {ANALYZING_MESSAGES[analyzingIndex]}
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Results: recommended demo classes ---------- */

  if (phase === "results") {
    return (
      <div className="asx-shell">
        <div className="asx-backdrop" aria-hidden="true">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
          <div className="auth-grain" />
        </div>
        <main className="asx-main">
          <section className="asx-card asx-results" aria-label="Assessment results">
            {/* Success header */}
            <div className="asx-success-head">
              <div className="asx-success-badge">
                <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">
                  <circle className="asx-check-circle" cx="26" cy="26" r="23" fill="none" />
                  <path
                    className="asx-check-mark"
                    d="M15 27.5l7.5 7.5L37.5 19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="asx-results-title">
                {String(answers.q0 ?? "").trim()
                  ? `You're all set, ${String(answers.q0).trim()}!`
                  : "Your perfect class is ready"}
              </h2>
              <p className="asx-results-sub">
                {resultSummary?.assessmentSummary}
              </p>
            </div>

            {/* Demo sessions */}
            <p className="asx-results-label">Free demo sessions</p>

            {demoStatus === "loading" ? (
              <div className="asx-demo-list" aria-hidden="true">
                <div className="asx-skeleton" style={{ height: "86px" }} />
                <div className="asx-skeleton" style={{ height: "86px", animationDelay: "120ms" }} />
              </div>
            ) : demos.length === 0 ? (
              <div className="asx-empty-state">
                <span className="asx-empty-icon">
                  <OptionIcon name="calendarX" />
                </span>
                <p className="asx-empty-title">No demo classes right now</p>
                <p className="asx-empty-body">
                  We&apos;re scheduling the next free sessions. We&apos;ll get back to you on
                  WhatsApp with your personal invite — keep an eye out.
                </p>
              </div>
            ) : (
              <div className="asx-demo-list">
                {demos.map((demo) => {
                  const spots = Math.max(demo.max_students - (demo.enrolled?.length ?? 0), 0);
                  const isFull = spots === 0;
                  const outcome = registrations[demo.id];
                  const busy = registeringId === demo.id;
                  return (
                    <article key={demo.id} className={`asx-demo-card${outcome === "confirmed" ? " confirmed" : ""}`}>
                      <div className="asx-demo-date" aria-hidden="true">
                        <strong>{formatDemoDate(demo.date).dayNum || "·"}</strong>
                        <span>{formatDemoDate(demo.date).month}</span>
                        <em>{formatDemoDate(demo.date).day}</em>
                      </div>
                      <div className="asx-demo-info">
                        <p className="asx-demo-time">{formatDemoTime(demo.time)}</p>
                        <p className="asx-demo-meta">{demo.duration} min · Free intro session</p>
                      </div>
                      {outcome === "confirmed" ? (
                        <span className="asx-registered-pill">
                          <OptionIcon name="shieldCheck" />
                          You&apos;re in
                        </span>
                      ) : (
                        <div className="asx-demo-side">
                          <span className={`asx-spots${spots <= 1 && !isFull ? " low" : ""}`}>
                            {isFull ? "Full" : `${spots} spot${spots === 1 ? "" : "s"} left`}
                          </span>
                          <button
                            type="button"
                            className={`asx-register-btn${isFull ? " disabled" : ""}`}
                            disabled={busy || isFull || outcome !== undefined}
                            onClick={() => registerForDemo(demo)}
                          >
                            {busy
                              ? "Reserving…"
                              : outcome === "requested"
                                ? "Requested ✓"
                                : outcome === "full"
                                  ? "Full"
                                  : "Register"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {demos.length > 0 && demoStatus === "ready" && (
              <p className="asx-results-note">
                Your WhatsApp number ({String(answers.q9 ?? "")}) keeps your spot confirmed.
              </p>
            )}

            {/* Exit actions */}
            <footer className="asx-footer">
              <button type="button" className="asx-cta" onClick={() => router.push("/")}>
                <span className="asx-cta-shine" aria-hidden="true" />
                Back to Main Menu
              </button>
              <div className="asx-footer-row center">
                <span className="asx-hint">You can also simply close this page.</span>
              </div>
            </footer>
          </section>
        </main>
      </div>
    );
  }

  /* ---------- Question journey ---------- */

  return (
    <div className="asx-shell">
      <div className="asx-backdrop" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="auth-grain" />
      </div>

      <main className="asx-main">
        <section className="asx-card" aria-label="AI Pilates Assessment">
          {/* Header: brand + progress ring */}
          <header className="asx-head">
            <div className="asx-head-copy">
              <p className="asx-eyebrow">AI Pilates Assessment</p>
              <h1 className="asx-title">Your personalised wellness journey</h1>
            </div>

            <div
              className="asx-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={answeredCount}
              aria-label={`${answeredCount} of ${TOTAL} questions answered`}
            >
              <svg viewBox="0 0 72 72" width="72" height="72">
                <circle className="asx-progress-track" cx="36" cy="36" r={RING_RADIUS} />
                <circle
                  className="asx-progress-value"
                  cx="36"
                  cy="36"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                />
              </svg>
              <div className="asx-progress-center">
                <strong>{answeredCount}</strong>
                <span>/ {TOTAL}</span>
              </div>
            </div>
          </header>

          {/* AI companion */}
          <div className="asx-companion" aria-live="polite">
            <span className="asx-companion-avatar">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" fill="currentColor" />
              </svg>
            </span>
            <p key={companionIndex} className="asx-companion-msg">
              {COMPANION_MESSAGES[companionIndex]}
            </p>
          </div>

          {/* Question */}
          <div className="asx-step-meta">
            <span className="asx-step-count">Question {step + 1} of {TOTAL}</span>
            <span className="asx-step-dots" aria-hidden="true">
              {ASSESSMENT_QUESTIONS.map((q, i) => (
                <i key={q.id} className={i === step ? "on" : i < step ? "done" : ""} />
              ))}
            </span>
          </div>

          <div className="asx-question-wrap" key={question.id}>
            <h2 className="asx-question">{question.text}</h2>

            {question.input === "location" ? (
              <LocationField
                value={answers[question.id] as string | undefined}
                onChange={(v) => handleAnswer(question.id, v)}
              />
            ) : question.input === "tel" ? (
              <PhoneField
                value={answers[question.id] as string | undefined}
                onChange={(v) => handleAnswer(question.id, v)}
              />
            ) : question.input === "text" ? (
              <div className="asx-input-block">
                <div className="asx-input-shell">
                  <span className="asx-input-icon">
                    <OptionIcon name="sparkles" />
                  </span>
                  <input
                    type="text"
                    className="asx-input-field"
                    value={(answers[question.id] as string) ?? ""}
                    placeholder={question.placeholder ?? ""}
                    autoComplete="given-name"
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                  />
                </div>
                <p className="asx-input-note">We&apos;ll personalise your plan with your name.</p>
              </div>
            ) : question.numeric ? (
              <div className="asx-slider-block">
                <div className="asx-slider-readout">
                  <span className="asx-slider-num">{Number(answers[question.id] ?? 5)}</span>
                  <span className="asx-slider-scale">out of 10</span>
                </div>
                <input
                  type="range"
                  className="asx-slider"
                  min={question.min ?? 0}
                  max={question.max ?? 10}
                  step={1}
                  value={Number(answers[question.id] ?? 5)}
                  onChange={(e) => handleAnswer(question.id, Number(e.target.value))}
                  aria-label={question.text}
                />
                <div className="asx-slider-hints" aria-hidden="true">
                  <span>Just starting</span>
                  <span>Strong & steady</span>
                  <span>Athlete</span>
                </div>
              </div>
            ) : (
              <div className="asx-options" role="radiogroup" aria-label={question.text}>
                {(question.options ?? []).map((option, i) => {
                  const selected = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`asx-option${selected ? " selected" : ""}`}
                      style={{ animationDelay: `${i * 70}ms` }}
                      onClick={() => selectOption(option)}
                    >
                      <span className="asx-option-icon">
                        <OptionIcon name={OPTION_ICONS[option] ?? "sparkles"} />
                      </span>
                      <span className="asx-option-label">{option}</span>
                      <span className="asx-option-check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="12" height="12">
                          <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {question.id === "q10" && (
              <p className="asx-consent-note">
                Only for your class plan and reminders — no spam. Opt out anytime by
                replying &ldquo;STOP&rdquo;.
              </p>
            )}
          </div>

          {/* Footer actions */}
          <footer className="asx-footer">
            {isFinalStep ? (
              <button type="button" className="asx-cta" onClick={submitAssessment} disabled={!hasAnsweredCurrent}>
                <span className="asx-cta-shine" aria-hidden="true" />
                Complete Assessment
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                  <path d="M5 12h13m-5.5-5.5L18 12l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className={`asx-continue${hasAnsweredCurrent ? "" : " waiting"}`}
                onClick={() => (hasAnsweredCurrent ? advanceStep() : goToFirstUnanswered())}
                disabled={!hasAnsweredCurrent}
              >
                Continue
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M5 12h13m-5.5-5.5L18 12l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <div className="asx-footer-row">
              {step > 0 && (
                <button type="button" className="asx-back" onClick={goBack}>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M19 12H6m5.5 5.5L6 12l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>
              )}
              {!hasAnsweredCurrent && step > 0 && <span className="asx-hint">Choose one to continue</span>}
              {hasAnsweredCurrent && <span />}
              <button type="button" className="asx-skip" onClick={onClose}>
                Skip Assessment
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
