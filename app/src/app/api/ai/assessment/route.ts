import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { isAIEnabled } from "@/lib/ai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, responses } = req.body;

    if (!userId || !responses || !Array.isArray(responses)) {
      return res
        .status(400)
        .json({ error: "Missing required fields: userId, responses" });
    }

    // Check if AI is enabled
    const { data: settings } = await supabase
      .from("studio_settings")
      .select("*")
      .single();

    if (!isAIEnabled(settings)) {
      return res.status(200).json({
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
    if (error) return res.status(200).json({ mode: "fallback", level: classifyLevelHeuristic(responses), recommendedClasses: getRecommendationsHeuristic(responses), message: "AI failed - using fallback" });

    if (data?.content) {
      try {
        const parsed = JSON.parse(data.content);
        return res.status(200).json({
          mode: "ai",
          level: parsed.level || classifyLevelHeuristic(responses),
          recommendedClasses: parsed.recommendedClasses || getRecommendationsHeuristic(responses),
          focusAreas: parsed.focusAreas || [],
          assessmentSummary: parsed.assessmentSummary || "",
        });
      } catch {
        // Invalid JSON from AI, fall through to heuristic
      }
    }

    // Fallback to heuristic classification
    return res.status(200).json({
      mode: "fallback",
      level: classifyLevelHeuristic(responses),
      recommendedClasses: getRecommendationsHeuristic(responses),
      message: "AI failed - using fallback heuristic classification",
    });

  } catch (error) {
    console.error("AI Assessment API error:", error);
    return res.status(500).json({ error: "Internal server error during AI assessment" });
  }
}

function classifyLevelHeuristic(responses: any[]): "beginner" | "intermediate" | "advanced" {
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

function getRecommendationsHeuristic(responses: any[]): string[] {
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