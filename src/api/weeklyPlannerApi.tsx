import Cookies from "js-cookie";
import { GenerateWeeklyPlanRequest, WeeklyPlanResponse } from "../types/weeklyPlanner";

const BASE_URL = "https://fitness-backend-15563671567.europe-west8.run.app";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No token found");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function generateWeeklyPlan(request: GenerateWeeklyPlanRequest): Promise<WeeklyPlanResponse> {
  const response = await fetch(`${BASE_URL}/api/weekly-planner/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to generate plan (${response.status})`);
  }
  return response.json();
}
export async function fetchCurrentWeeklyPlan(studentId: number): Promise<WeeklyPlanResponse | null> {
  const response = await fetch(`${BASE_URL}/api/weekly-planner/current?studentId=${studentId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Failed to fetch current weekly plan (${response.status})`);
  return response.json();
}
export async function setWeeklyPlanItemCompleted(
  itemId: number,
  studentId: number,
  completed: boolean
): Promise<void> {
  const params = new URLSearchParams({ studentId: String(studentId), completed: String(completed) });
  const response = await fetch(`${BASE_URL}/api/weekly-planner/items/${itemId}/completed?${params.toString()}`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to update exercise status (${response.status})`);
  }
}