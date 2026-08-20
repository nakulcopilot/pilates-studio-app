import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, userId } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing required field: query" });
    }

    // Parse day of week from query
    const dayNames: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };
    let filterDay: number | undefined;
    const dayMatch = query.toLowerCase().match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      filterDay = dayNames[dayMatch[1]];
    }

    // Parse time range from query
    const timeRangeMap: Record<string, { start: number; end: number }> = {
      morning: { start: 6, end: 12 },
      afternoon: { start: 12, end: 17 },
      evening: { start: 17, end: 21 },
    };
    let filterTimeRange: { start: number; end: number } | undefined;
    if (query.toLowerCase().includes("morning")) {
      filterTimeRange = { start: 6, end: 12 };
    } else if (query.toLowerCase().includes("afternoon")) {
      filterTimeRange = { start: 12, end: 17 };
    } else if (query.toLowerCase().includes("evening")) {
      filterTimeRange = { start: 17, end: 21 };
    }

    // Parse class type from query
    let filterClassType: string = "all";
    const lower = query.toLowerCase();
    if (lower.includes("reformer")) filterClassType = "reformer";
    else if (lower.includes("mat")) filterClassType = "mat";
    else if (lower.includes("wunda") || lower.includes("chair")) filterClassType = "wunda_chair";
    else if (lower.includes("cadillac")) filterClassType = "cadillac";

    // Fetch classes from Supabase
    const { data: classes, error } = await supabase
      .from("studio_classes")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch classes" });
    }

    // Filter classes based on query parameters
    let matchedClasses = classes || [];

    if (filterClassType !== "all") {
      matchedClasses = matchedClasses.filter((c: any) => c.type === filterClassType);
    }
    if (filterDay !== undefined) {
      matchedClasses = matchedClasses.filter((c: any) => {
        const classDay = new Date(c.date).getDay();
        return classDay === 0 ? 7 : classDay === filterDay;
      });
    }
    if (filterTimeRange) {
      matchedClasses = matchedClasses.filter((c: any) => {
        const classHour = new Date(c.date).getHours();
        return classHour >= filterTimeRange.start && classHour < filterTimeRange.end;
      });
    }

    // Format results for UI
    const formattedResults = (matchedClasses || []).map((c: any) => ({
      id: c.id,
      type: c.type,
      level: c.level,
      date: new Date(c.date).toLocaleDateString(),
      time: new Date(c.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      instructor: c.instructor || "TBA",
      studio: c.studio || "Studio",
      availableSpots: c.available_spots,
      maxSpots: c.max_students,
      price: c.price,
    }));

    return res.status(200).json({
      query,
      totalResults: formattedResults.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error("Booking search API error:", error);
    return res.status(500).json({ error: "Internal server error during booking search" });
  }
}