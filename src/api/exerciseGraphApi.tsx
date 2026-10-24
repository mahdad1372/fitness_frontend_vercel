import Cookies from "js-cookie";
import { Exercise, PathResult } from "../types/exerciseGraph";

const BASE_URL = "https://fitness-backend-15563671567.europe-west8.run.app/api/exercises";

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

export async function fetchAllExercises(): Promise<Exercise[]> {
  const response = await fetch(BASE_URL, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch exercises");
  }
  return response.json();
}

export async function fetchSubstitutes(
  exerciseId: number,
  unavailableEquipment: string[],
  maxResults = 5
): Promise<Exercise[]> {
  const params = new URLSearchParams();
  unavailableEquipment.forEach((eq) => params.append("unavailableEquipment", eq));
  params.append("maxResults", String(maxResults));

  const response = await fetch(`${BASE_URL}/${exerciseId}/substitutes?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch substitutes");
  }
  return response.json();
}

export async function fetchProgressionOrder(muscleGroup: string): Promise<Exercise[]> {
  const params = new URLSearchParams({ muscleGroup });
  const response = await fetch(`${BASE_URL}/progression?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch progression roadmap");
  }
  return response.json();
}

// Returns null when no path exists between the two exercises (backend responds 404).
export async function fetchSmoothestPath(
  fromExerciseId: number,
  toExerciseId: number
): Promise<PathResult | null> {
  const params = new URLSearchParams({
    from: String(fromExerciseId),
    to: String(toExerciseId),
  });
  const response = await fetch(`${BASE_URL}/path?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch smoothest path");
  }
  return response.json();
}