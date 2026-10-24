export type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const DAYS: Day[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export const DAY_LABELS: Record<Day, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export interface GenerateWeeklyPlanRequest {
  dailyBudgetMinutes: Record<Day, number>;
  muscleGroups: string[];
  weekStartDate: string; // ISO date, e.g. "2026-10-12"
}

export interface PlannedExercise {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  durationMinutes: number;
  value: number;
  substituted: boolean;
  originalExerciseId: number | null;
  originalName: string | null;
  startTime: string | null; 
  endTime: string | null;   
  equipmentName: string | null;
  schedulingNote: string | null;
  itemId: number;
  completed: boolean;
  sets: number;
  rpe: number;
}
export interface GenerateWeeklyPlanRequest {
  dailyBudgetMinutes: Record<Day, number>;
  muscleGroups: string[];
  weekStartDate: string;
  studentId: number; // NEW
}
export interface WeeklyPlanResponse {
  planByDay: Record<Day, PlannedExercise[]>;
  weeklyBudgetMinutes: number;
  totalMinutesUsed: number;
  totalValue: number;
}