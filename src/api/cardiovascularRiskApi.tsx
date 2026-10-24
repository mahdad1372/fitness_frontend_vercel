import Cookies from "js-cookie";
import {
  CardiovascularAssessmentRequest,
  CardiovascularAssessmentResponse,
} from "../types/cardiovascularRisk";

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

export async function assessCardiovascularRisk(
  userId: number,
  payload: CardiovascularAssessmentRequest
): Promise<CardiovascularAssessmentResponse> {
  const response = await fetch(`${BASE_URL}/health_metric/cardiovascular/${userId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Failed to calculate cardiovascular risk.");
  }
  return response.json();
}