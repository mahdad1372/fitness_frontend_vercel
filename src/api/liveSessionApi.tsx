import Cookies from "js-cookie";

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

export interface DataPoint {
  dataTypeName: string;
  startTimeMillis: number;
  endTimeMillis: number;
  value: number;
}

export interface SensorReading {
  liveSessionId: number;
  phase: "WARMUP" | "ACTIVE" | "COOLDOWN" | "DONE";
  elapsedMinutes: number;
  durationMinutes: number;
  readings: DataPoint[];
}

export interface PreSessionCheck {
  systolic: number;
  diastolic: number;
  clearedToStart: boolean;
}

export interface StartSessionResponse {
  liveSessionId: number | null;
  preSessionCheck: PreSessionCheck;
}

export async function startLiveSession(params: {
  itemId: number;
  studentId: number;
  exerciseName: string;
  durationMinutes: number;
  difficultyLevel: number;
  muscleGroup?: string;
}): Promise<StartSessionResponse> {
  const response = await fetch(`${BASE_URL}/api/live-sessions/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to start the live session (${response.status})`);
  }
  return response.json();
}

export async function fetchLiveReading(liveSessionId: number, studentId: number): Promise<SensorReading> {
  const response = await fetch(`${BASE_URL}/api/live-sessions/${liveSessionId}/reading?studentId=${studentId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to fetch the live reading (${response.status})`);
  }
  return response.json();
}

export async function finishLiveSession(liveSessionId: number, studentId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/live-sessions/${liveSessionId}/finish?studentId=${studentId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to finish the live session (${response.status})`);
  }
}