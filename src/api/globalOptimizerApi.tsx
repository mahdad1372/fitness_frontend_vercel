import Cookies from "js-cookie";
import { GlobalOptimizationRequest, GlobalOptimizationResponse } from "../types/globalOptimizer";

const BASE_URL = "http://localhost:7000";

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

export async function generateGlobalOptimizationPlans(
  request: GlobalOptimizationRequest
): Promise<GlobalOptimizationResponse> {
  const response = await fetch(`${BASE_URL}/api/global-optimizer/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to generate global plan (${response.status})`);
  }
  return response.json();
}
