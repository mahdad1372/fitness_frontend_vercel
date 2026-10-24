export interface Exercise {
  exercise_id: number;
  name: string;
  muscle_group: string;
  equipment_required: string | null;
  difficulty_level: number;
}

export interface PathResult {
  path: number[];
  totalCost: number;
}

// Difficulty tiers used for the color coding in the roadmap / library views.
// 1-3 beginner, 4-6 intermediate, 7-10 advanced.
export type DifficultyTier = "beginner" | "intermediate" | "advanced";

export function difficultyTier(level: number): DifficultyTier {
  if (level <= 3) return "beginner";
  if (level <= 6) return "intermediate";
  return "advanced";
}

export const TIER_COLOR: Record<DifficultyTier, string> = {
  beginner: "#12b76a",
  intermediate: "#f79009",
  advanced: "#f04438",
};

export const TIER_BADGE_COLOR: Record<DifficultyTier, "success" | "warning" | "error"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "error",
};