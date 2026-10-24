export const GOALS = ["MUSCLE_GAIN", "FAT_LOSS", "MAINTENANCE"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  MUSCLE_GAIN: "Muscle Gain",
  FAT_LOSS: "Fat Loss",
  MAINTENANCE: "Maintenance",
};

export const ACTIVITY_LEVELS = [
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "ACTIVE",
  "VERY_ACTIVE",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentary",
  LIGHTLY_ACTIVE: "Lightly active",
  MODERATELY_ACTIVE: "Moderately active",
  ACTIVE: "Active",
  VERY_ACTIVE: "Very active",
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Client-side MIRROR of the backend's MacroCalculator (graph/MacroCalculator.java) -
// used ONLY to show an instant preview when "Calculate Targets" is clicked,
// before the plan is generated. The backend recomputes this same formula
// authoritatively every time a plan is actually generated (unless the
// targets below were hand-edited afterward, in which case those edited
// numbers are sent as a manual override instead) - so any drift between
// this copy and the backend's only affects the preview shown here, never
// the real plan.
export function calculateMacroTargets(
  age: number,
  gender: string,
  weightKg: number,
  heightCm: number,
  goal: Goal,
  activityLevel: ActivityLevel
): MacroTargets {
  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (gender.toLowerCase() === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTORS[activityLevel];

  const calorieTarget =
    goal === "MUSCLE_GAIN" ? tdee * 1.12 : goal === "FAT_LOSS" ? tdee * 0.8 : tdee;

  const proteinPerKg = goal === "MUSCLE_GAIN" ? 2.0 : goal === "FAT_LOSS" ? 2.2 : 1.8;
  const fatPerKg = goal === "MUSCLE_GAIN" ? 0.9 : goal === "FAT_LOSS" ? 0.8 : 0.9;

  const proteinGrams = proteinPerKg * weightKg;
  const fatGrams = fatPerKg * weightKg;
  const carbCalories = Math.max(0, calorieTarget - proteinGrams * 4 - fatGrams * 9);
  const carbGrams = carbCalories / 4;

  return {
    calories: Math.round(calorieTarget),
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbGrams),
    fat: Math.round(fatGrams),
  };
}

export interface MealPlanRequest {
  userId: number;
  age?: number;
  gender?: string;
  weightKg?: number;
  heightCm?: number;
  goal?: Goal;
  activityLevel?: ActivityLevel;
  manualCalories?: number;
  manualProtein?: number;
  manualCarbs?: number;
  manualFat?: number;
  excludeFoodIds?: number[];
}

export interface PlannedFood {
  foodId: number;
  name: string;
  mealSlot: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanResponse {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  achievedCalories: number;
  achievedProtein: number;
  achievedCarbs: number;
  achievedFat: number;
  selectedFoods: PlannedFood[];
  excludedFoods: PlannedFood[];
}

// Foods as the /foods endpoints return them (snake_case, matching the
// Foods JPA entity directly) - kept separate from PlannedFood, which is
// the planner's own camelCase response shape.
export interface FoodRow {
  food_id: number;
  user_id: number;
  food_name: string;
  category: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  meal_time: string;
}