import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAIEnabled } from "@/lib/ai";
import type { StudioSettings } from "@/lib/types";

interface AssessmentResponse {
  questionId?: string;
  answer?: string | number;
  unit?: string;
}

export async function POST(req: NextRequest) {
  let body: { userId?: string; responses?: AssessmentResponse[] } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, responses } = body ?? {};
  if (!userId || !responses || !Array.isArray(responses)) {
    return NextResponse.json(
      { error: "Missing required fields: userId, responses" },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Load studio AI settings (single row, id = 1).
    const { data: row } = await supabase
      .from("studio_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();

    const settings = row
      ? ({ id: 1, data: row.data } as unknown as StudioSettings)
      : null;

    if (!isAIEnabled(settings)) {
      return NextResponse.json({
        mode: "heuristic",
        level: classifyLevelHeuristic(responses),
        recommendedClasses: getRecommendationsHeuristic(responses),
        message: "AI assessment disabled - using heuristic classification",
      });
    }

    // Call AI assessment via edge function
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        messages: [
          { role: "system", content: "You are an AI Pilates Assessment Assistant for Pilates with Neelam. Given the user's assessment responses, classify their Pilates level and recommend appropriate classes. Respond with JSON: {level: 'beginner'|'intermediate'|'advanced', recommendedClasses: [string], focusAreas: [string], assessmentSummary: string}" },
          { role: "user", content: `User assessment responses: ${JSON.stringify(responses)}` },
        ],
      },
    });

    if (error) {
      return NextResponse.json({
        mode: "fallback",
        level: classifyLevelHeuristic(responses),
        recommendedClasses: getRecommendationsHeuristic(responses),
        message: "AI failed - using fallback",
      });
    }

    if (data?.content) {
      try {
        const parsed = JSON.parse(data.content);
        return NextResponse.json({
          mode: "ai",
          level: parsed.level || classifyLevelHeuristic(responses),
          recommendedClasses: parsed.recommendedClasses || getRecommendationsHeuristic(responses),
          focusAreas: parsed.focusAreas || [],
          assessmentSummary: parsed.assessmentSummary || "",
          aiAssisted: true,
          aiRecommendationSource: "AI Assessment",
          disclaimer:
            "AI-generated assessment recommendations. Consult with instructor for personalized advice and modifications.",
        });
      } catch {
        // Invalid JSON from AI, fall through to heuristic
      }
    }

    // Fallback to heuristic classification
    return NextResponse.json({
      mode: "fallback",
      level: classifyLevelHeuristic(responses),
      recommendedClasses: getRecommendationsHeuristic(responses),
      message: "AI failed - using fallback heuristic classification",
    });
  } catch (error) {
    console.error("AI Assessment API error:", error);
    return NextResponse.json(
      { error: "Internal server error during AI assessment" },
      { status: 500 },
    );
  }
}

function classifyLevelHeuristic(responses: AssessmentResponse[]): "beginner" | "intermediate" | "advanced" {
  const responsesText = responses
    .map((r) => String(r?.answer ?? "").toLowerCase())
    .join(" ");
  const beginnerKeywords = ["new", "first", "starting", "never", "beginner", "0", "1", "2"];
  const advancedKeywords = ["expert", "advanced", "pro", "years", "5", "10", "15", "strong", "flexible"];
  const beginnerCount = beginnerKeywords.filter((k) => responsesText.includes(k.toLowerCase())).length;
  const advancedCount = advancedKeywords.filter((k) => responsesText.includes(k.toLowerCase())).length;
  if (advancedCount > beginnerCount) return "advanced";
  if (beginnerCount > 0) return "beginner";
  return "intermediate";
}

function getRecommendationsHeuristic(responses: AssessmentResponse[]): string[] {
  const level = classifyLevelHeuristic(responses);
  const recommendations: string[] = [];
  if (level === "beginner") {
    recommendations.push("mat", "reformer-basics", "wunda-chair-intro");
  } else if (level === "intermediate") {
    recommendations.push("reformer", "mat-intermediate", "wunda-chair");
  } else {
    recommendations.push("advanced-reformer", "mat-advanced", "chair-advanced");
  }
  return recommendations;
}
