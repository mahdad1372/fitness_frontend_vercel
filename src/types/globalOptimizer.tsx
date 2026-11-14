import { Day, WeeklyPlanResponse } from "./weeklyPlanner";
import { Goal, ActivityLevel, MealPlanResponse } from "./mealPlanner";

// Mirrors the backend's GlobalOptimizationRequest - the Global Fitness
// Plan Optimizer (V1) coordinates the EXISTING Exercise Graph, Weekly
// Planner and Meal Planner, so its input is deliberately the union of
// what those two already ask for (see GenerateWeeklyPlanRequest and
// MealPlanRequest's goal/activityLevel fields).
export interface GlobalOptimizationRequest {
  studentId: number;
  weekStartDate: string; // ISO date
  muscleGroups: string[];
  dailyBudgetMinutes: Record<Day, number>;
  goal: Goal;
  activityLevel: ActivityLevel;
}

// One of the 3 trade-off plans - a real weekly exercise schedule plus a
// real representative day's meal plan, with the raw objective scores that
// got this particular candidate picked. See the backend's
// GlobalFitnessOptimizer class doc for exactly what each score means and
// why there are only 3 named profiles rather than a full Pareto front.
export interface GlobalPlanOption {
  label: string;
  description: string;
  candidateConfig: string;
  weeklyPlan: WeeklyPlanResponse;
  mealPlan: MealPlanResponse;
  progressScore: number;
  fatigueScore: number;
  costScore: number;
  inconvenienceScore: number;
  preferenceScore: number;
  overallScore: number;
}

export interface GlobalOptimizationResponse {
  plans: GlobalPlanOption[];
}
