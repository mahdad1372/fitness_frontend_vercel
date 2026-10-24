import Cookies from "js-cookie";
import { MealPlanRequest, MealPlanResponse, FoodRow } from "../types/mealPlanner";

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

// Profile fields (age/gender/weight/height) for the "About you today" card -
// /users/me returns the authenticated user straight off the security
// principal, same endpoint Foods.tsx already uses to check the caller's role.
export async function fetchCurrentUser(): Promise<{
  user_id: number;
  age: number;
  gender: string;
  weight: number;
  height: number;
}> {
  const response = await fetch(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }
  return response.json();
}

// Candidate foods for the day - same endpoint Foods.tsx already calls.
export async function fetchUserFoods(userId: number): Promise<FoodRow[]> {
  const response = await fetch(`${BASE_URL}/foods/food_user_id/${userId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch foods");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

export async function generateMealPlan(request: MealPlanRequest): Promise<MealPlanResponse> {
  const response = await fetch(`${BASE_URL}/api/meal-planner/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error("Failed to generate meal plan");
  }
  return response.json();
}