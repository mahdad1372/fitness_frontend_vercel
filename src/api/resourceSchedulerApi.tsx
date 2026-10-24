import Cookies from "js-cookie";
import {
  EquipmentDto,
  CoachSummary,
  MyCoachDto,
  SessionRequestDto,
  CreateSessionRequestPayload,
  OptimizeScheduleResponse,
  EquipmentStatusDto,
  EquipmentQueueEntryDto,
} from "../types/resourceScheduler";

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

export async function fetchEquipment(): Promise<EquipmentDto[]> {
  const response = await fetch(`${BASE_URL}/api/equipment`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch equipment (${response.status})`);
  return response.json();
}

export async function createEquipment(name: string, capacity: number): Promise<EquipmentDto> {
  const response = await fetch(`${BASE_URL}/api/equipment`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, capacity }),
  });
  if (!response.ok) throw new Error(`Failed to create equipment (${response.status})`);
  return response.json();
}

// ==========================
// One-coach-per-student subscription - backed by the EXISTING Cart table
// (cart_item = "PRIVATE COACH"), the same source the sidebar/Chat already
// use. /api/coaches and /api/students/{id}/coach are read-only; subscribing
// or changing coaches calls the existing /cart/* endpoints directly instead
// of a new backend route.
// ==========================

export async function fetchCoaches(): Promise<CoachSummary[]> {
  const response = await fetch(`${BASE_URL}/api/coaches`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch coaches (${response.status})`);
  return response.json();
}

export async function fetchMyCoach(studentId: number): Promise<MyCoachDto> {
  const response = await fetch(`${BASE_URL}/api/students/${studentId}/coach`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch your coach (${response.status})`);
  return response.json();
}

// First time a student picks a coach - creates the "PRIVATE COACH" Cart row.
export async function subscribeToCoach(studentId: number, coachId: number, price: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      cart_item: "PRIVATE COACH",
      price,
      coach_id: coachId,
      user_id: studentId,
    }),
  });
  if (!response.ok) throw new Error(`Failed to subscribe to that coach (${response.status})`);
}

// Switching coaches - updates the existing "PRIVATE COACH" Cart row in
// place (a student only ever has one).
export async function changeCoach(cartId: number, studentId: number, coachId: number, price: number): Promise<void> {
  const params = new URLSearchParams({
    cartItem: "PRIVATE COACH",
    price: String(price),
    coachId: String(coachId),
    userId: String(studentId),
  });
  const response = await fetch(`${BASE_URL}/cart/updatecart/${cartId}?${params.toString()}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to update your coach (${response.status})`);
}

// ==========================
// Booking a session (no coach/price fields - see CreateSessionRequestPayload)
// ==========================

export async function fetchPendingRequests(): Promise<SessionRequestDto[]> {
  const response = await fetch(`${BASE_URL}/api/session-requests/pending`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch pending requests (${response.status})`);
  return response.json();
}

export async function createSessionRequest(payload: CreateSessionRequestPayload): Promise<SessionRequestDto> {
  const response = await fetch(`${BASE_URL}/api/session-requests`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to create session request (${response.status})`);
  }
  return response.json();
}

export async function optimizeSchedule(): Promise<OptimizeScheduleResponse> {
  const response = await fetch(`${BASE_URL}/api/resource-scheduler/optimize`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to optimize schedule (${response.status})`);
  return response.json();
}

// ==========================
// Live Equipment Board - walk-up check-in/out + queue
// ==========================

export async function fetchEquipmentStatus(userId: number): Promise<EquipmentStatusDto[]> {
  const response = await fetch(`${BASE_URL}/api/equipment/status?userId=${userId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch equipment status (${response.status})`);
  return response.json();
}

async function postAction(path: string, userId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
}

export async function checkInEquipment(equipmentId: number, userId: number): Promise<void> {
  return postAction(`/api/equipment/${equipmentId}/checkin`, userId);
}

export async function checkOutEquipment(equipmentId: number, userId: number): Promise<void> {
  return postAction(`/api/equipment/${equipmentId}/checkout`, userId);
}

export async function joinEquipmentQueue(equipmentId: number, userId: number): Promise<void> {
  return postAction(`/api/equipment/${equipmentId}/queue`, userId);
}

export async function leaveEquipmentQueue(equipmentId: number, userId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/equipment/${equipmentId}/queue/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to leave queue");
}

export async function fetchEquipmentQueue(equipmentId: number): Promise<EquipmentQueueEntryDto[]> {
  const response = await fetch(`${BASE_URL}/api/equipment/${equipmentId}/queue`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch equipment queue");
  return response.json();
}