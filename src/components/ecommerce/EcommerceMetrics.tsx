import {
  ArrowDownIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

// How often to re-poll the virtual sensor for a fresh resting reading.
// Matches the backend's own tick rate (RestingVitalsEngine ticks every
// 3000ms) so the dashboard never shows a stale number for long.
const VITALS_POLL_MS = 3000;

export default function EcommerceMetrics() {
  // ---------- Role (used to gate cardiovascular card) ----------
  // Adjust this if the role lives somewhere else (e.g. fetched from /users/:id
  // instead of a cookie) — swap the line below for that source.
  const userRole = Cookies.get("userrole") ?? "";
  const isCoach = userRole.toUpperCase() === "COACH";

  // ---------- Blood pressure state ----------
  const [bpData, setBpData] = useState({
    averageSystolic: 0,
    averageDiastolic: 0,
    loading: true,
  });

  // ---------- Heart rate state ----------
  const [bpmData, setBpmData] = useState({
    average_bpm: 0,
  });

  // ---------- Cardiovascular state ----------
  const [cardioData, setCardioData] = useState({
    cardio: 0,
    status: "",
    loading: false,
  });

  // ============================================================
  // BLOOD PRESSURE + HEART RATE - from the backend's virtual sensor
  // (RestingVitalsEngine), the same simulated-but-realistic approach the
  // Live Session already uses for workout heart rate. No Google Fit OAuth,
  // no "data source" to create first, no patch-then-fetch dance - just
  // poll the two endpoints and show whatever they return. Polling (instead
  // of fetching once) is what makes the numbers drift slightly over time
  // instead of sitting frozen, matching how RestingVitalsEngine itself
  // nudges each user's values on every tick.
  // ============================================================

  useEffect(() => {
    const userId = Cookies.get("userId");
    const token = Cookies.get("token");

    if (!userId || !token) {
      console.error("User ID or token cookie not found");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchVitals = () => {
      fetch(`https://fitness-backend-15563671567.europe-west8.run.app/virtual-sensor/blood-pressure/${userId}`, {
        method: "GET",
        headers,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              `Failed to fetch blood pressure: ${res.status} ${JSON.stringify(data)}`
            );
          }
          return data;
        })
        .then((data) => {
          setBpData({
            averageSystolic: data.averageSystolic ?? 0,
            averageDiastolic: data.averageDiastolic ?? 0,
            loading: false,
          });
        })
        .catch((err) => {
          console.error("Error fetching blood pressure:", err);
          setBpData((prev) => ({ ...prev, loading: false }));
        });

      fetch(`https://fitness-backend-15563671567.europe-west8.run.app/virtual-sensor/heart-rate/${userId}`, {
        method: "GET",
        headers,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              `Failed to fetch heart rate: ${res.status} ${JSON.stringify(data)}`
            );
          }
          return data;
        })
        .then((data) => {
          setBpmData({ average_bpm: data.averageBpm ?? 0 });
        })
        .catch((err) => {
          console.error("Error fetching heart rate data:", err);
        });
    };

    fetchVitals();
    const intervalId = setInterval(fetchVitals, VITALS_POLL_MS);
    return () => clearInterval(intervalId);
  }, []);

  // ============================================================
  // CARDIOVASCULAR
  // ============================================================

  useEffect(() => {
    // Coaches don't see cardiovascular data, so skip the fetch entirely.
    if (isCoach) {
      return;
    }

    const userId = Cookies.get("userId");

    if (!userId) {
      console.error("User ID cookie not found");
      return;
    }

    fetch(`https://fitness-backend-15563671567.europe-west8.run.app/health_metric/cardiovascular/${userId}`, {
      method: "GET",
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            `Failed to fetch cardiovascular data: ${res.status} ${JSON.stringify(
              data
            )}`
          );
        }

        return data;
      })
      .then((data) => {
        console.log("Cardiovascular data:", data);

        setCardioData({
          cardio: data.cardio ?? 0,
          status: data.status ?? "",
          loading: false,
        });
      })
      .catch((err) => {
        console.error("Error fetching cardiovascular data:", err);

        setCardioData((prev) => ({
          ...prev,
          loading: false,
        }));
      });
  }, [isCoach]);

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">

      {/* Blood pressure */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Blood pressure
          </span>

          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {bpData.loading
              ? "Loading..."
              : `${bpData.averageSystolic}/${bpData.averageDiastolic} mmHg`}
          </h4>
        </div>
      </div>

      {/* Heart rate */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Heartrate
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {bpmData.average_bpm} bpm
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>

      {/* Cardiovascular — hidden for coaches */}
      {!isCoach && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Cardiovascular
              </span>

              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {cardioData.cardio.toFixed(2)}
              </h4>
            </div>

            <Badge color="error">
              <ArrowDownIcon />
              Risk heart attack {cardioData.status}
            </Badge>
          </div>
        </div>
      )}

    </div>
  );
}