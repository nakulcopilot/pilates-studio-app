"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateWithFallback } from "@/lib/ai";
import { createClient } from "@/lib/supabase/browser";

export interface AssessmentQuestion {
  id: string;
  text: string;
  options?: string[];
  numeric?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface AssessmentResult {
  level: "beginner" | "intermediate" | "advanced";
  focusAreas: string[];
  recommendedClasses: string[];
  assessmentSummary: string;
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
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
];

export default function AssessmentModal({
  onComplete,
  onClose,
}: {
  onComplete: (result: AssessmentResult) => void;
  onClose: () => void;
}) {
  const router = useRouter();

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timer, setTimer] = useState(120);

  const handleAnswer = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const classifyLevel = (answers: Record<string, string | number>): "beginner" | "intermediate" | "advanced" => {
    const q1 = String(answers.q1 ?? "");
    const q4 = String(answers.q4 ?? "");
    const q6 = Number(answers.q6) || 0;

    const isAdvanced = q1.includes("advanced") || q6 >= 8;
    const isBeginner = q1.includes("beginner") || q6 <= 2 || q4.includes("significant");

    if (isAdvanced) return "advanced";
    if (isBeginner) return "beginner";
    return "intermediate";
  };

  const determineFocusAreas = (answers: Record<string, string | number>): string[] => {
    const areas: string[] = [];
    const q2 = String(answers.q2 ?? "");
    const q4 = String(answers.q4 ?? "");
    const q5 = String(answers.q5 ?? "");

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

    // Add focus area specific recommendations (avoid duplicates)
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
    clearInterval(timerRef.current!);

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

    // Call AI assessment API
    try {
      const { error } = await supabase
        .from("ai_assessment_results")
        .insert({
          user_id: (await import("@/app/(auth)").getCurrentUser()?.id) || "temp",
          responses: answers,
          level,
          focus_areas: focusAreas,
          recommended_classes: recommendedClasses,
          created_at: new Date().toISOString(),
        });

      if (error) console.error("DB insert error:", error);
    } catch (err) {
      console.error("Assessment save error:", err);
    }

    onComplete(result);
    router.push("/booking-recommendations");
  };

  useEffect(() => {
    if (step === 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(timerRef.current!);
            submitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const startAIAnalysis = async () => {
    // Call the assessment API
    const { data, error } = await supabase
      .from("ai_assessment_results")
      .select()
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching assessment:", error);
      submitAssessment();
      return;
    }

    if (data && data.length > 0) {
      const last = data[0];
      setAnswers(last.responses || {});
      setStep(ASSESSMENT_QUESTIONS.length - 1);
      submitAssessment();
    } else {
      submitAssessment();
    }
  };

  const handleSubmit = () => {
    if (timer > 0) {
      submitAssessment();
    }
  };

  const handleClose = () => {
    clearInterval(timerRef.current!);
    // Just close, don't navigate
  };

  if (step < ASSESSMENT_QUESTIONS.length) {
    const question = ASSESSMENT_QUESTIONS[step];

    return (
      <div className="assessment-modal max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">AI Pilates Assessment</h2>

        <p className="text-gray-600 mb-8">
          Answer 5 quick questions to find your perfect Pilates class.
        </p>

        <div className="timer-badge absolute top-4 right-4">
          <span>{timer}s</span>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {ASSESSMENT_QUESTIONS.length - step} questions remaining
          </p>

          <h3 className="font-medium mb-3">
            {step + 1}. {question.text}
          </h3>

          {question.numeric ? (
            <input
              type="number"
              min={question.min ?? 0}
              max={question.max ?? 10}
              value={answers[question.id] as number || ""}
              onChange={(e) =>
                handleAnswer(question.id, Number(e.target.value))
              }
              className="w-full padding border rounded"
              placeholder={question.placeholder || "Enter number"}
            />
          ) : (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center padding border rounded cursor-pointer ${
                    answers[question.id] === option
                      ? "bg-green-100 text-green-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleAnswer(question.id, option)}
                    className="mr-2 accent-green-600"
                  />
                  {option}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          {timer > 0 ? (
            <button
              onClick={submitAssessment}
              className="w-full bg-green-600 text-white font-medium padding rounded hover:bg-green-700 transition-colors"
            >
              Complete Assessment ({timer}s remaining)
            </button>
          ) : (
            <button
              onClick={submitAssessment}
              className="w-full bg-green-600 text-white font-medium padding rounded hover:bg-green-700 transition-colors"
            >
              Time&apos;s up - Complete Assessment
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full mt-2 border padding rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Skip Assessment
          </button>
        </div>
      </div>
    );
  }

  return null;
}