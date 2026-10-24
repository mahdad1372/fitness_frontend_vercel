import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  startLiveSession,
  fetchLiveReading,
  finishLiveSession,
  SensorReading,
  PreSessionCheck,
} from "../../api/liveSessionApi";

interface LiveSessionPageProps {
  itemId: number;
  exerciseName: string;
  durationMinutes: number;
  difficultyLevel: number;
  muscleGroup?: string;
  // How many sets to split durationMinutes into, with a 1-minute rest
  // between each one (not after the last). Omitted/1/undefined - behaves
  // exactly as before, no rest breaks at all.
  sets?: number | null;
  // Fired the moment a rest break starts/ends (see the set/rest timer
  // below) - lets the caller release the exercise's equipment on the Live
  // Equipment Board during the break and re-reserve it the instant the
  // next set begins, instead of holding it "in use" the whole time.
  onEquipmentRelease?: () => void;
  onEquipmentReserve?: () => void;
  onFinished: () => void;
  onCancel: () => void;
}

const PHASE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  WARMUP: { bg: "#FFFAEB", color: "#B54708", label: "Warming up" },
  ACTIVE: { bg: "#FEF3F2", color: "#B42318", label: "Active" },
  COOLDOWN: { bg: "#ECF3FF", color: "#3641F5", label: "Cooling down" },
  DONE: { bg: "#ECFDF3", color: "#039855", label: "Session complete" },
};

function formatTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function LiveSessionPage({
  itemId,
  exerciseName,
  durationMinutes,
  difficultyLevel,
  muscleGroup,
  sets,
  onEquipmentRelease,
  onEquipmentReserve,
  onFinished,
  onCancel,
}: LiveSessionPageProps) {
  const studentId = Number(Cookies.get("userId"));

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [preSessionCheck, setPreSessionCheck] = useState<PreSessionCheck | null>(null);
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  const startedAtMillis = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const result = await startLiveSession({
          itemId, studentId, exerciseName, durationMinutes, difficultyLevel, muscleGroup,
        });
        setPreSessionCheck(result.preSessionCheck);
        if (result.preSessionCheck.clearedToStart && result.liveSessionId !== null) {
          setSessionId(result.liveSessionId);
          startedAtMillis.current = Date.now();
        }
      } catch (err) {
        console.error("Error starting live session:", err);
        setError(err instanceof Error ? err.message : "Couldn't start the session.");
      } finally {
        setStarting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const poll = async () => {
      try {
        const next = await fetchLiveReading(sessionId, studentId);
        setReading(next);
        const hr = next.readings.find((r) => r.dataTypeName === "com.google.heart_rate.bpm");
        if (hr) setHeartRateHistory((prev) => [...prev.slice(-19), hr.value]);
        if (next.phase === "DONE" && pollRef.current) clearInterval(pollRef.current);
      } catch (err) {
        console.error("Error fetching live reading:", err);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, studentId]);

  // Separate one-second ticker, purely for the MM:SS countdown display.
  useEffect(() => {
    if (!sessionId) return;
    const timerId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timerId);
  }, [sessionId]);

  // Sets & rest: splits durationMinutes into `sets` equal chunks and
  // inserts a 1-minute rest between each one. This is a client-side
  // overlay on top of the one continuous backend session/HR polling above
  // - the backend has no concept of "sets" for this synthetic session, so
  // its own phase (WARMUP/ACTIVE/COOLDOWN/DONE) and the overall countdown
  // keep running exactly as before, unaffected by rest breaks. Only the
  // Live Equipment Board booking actually changes: onEquipmentRelease
  // fires the moment a rest starts, onEquipmentReserve the moment the next
  // set begins, so the equipment sits genuinely free (and bookable by
  // someone else) during the break instead of marked "in use" the whole
  // time. Refs (not state) drive the interval's own logic so the interval
  // itself is only ever created once per session - the matching state
  // variables exist purely to re-render the rest/set-count UI below.
  const totalSets = Math.max(1, sets ?? 1);
  const currentSetRef = useRef(1);
  const restingRef = useRef(false);
  const setElapsedSecondsRef = useRef(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [resting, setResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);

  useEffect(() => {
    if (!sessionId || totalSets <= 1) return;
    const perSetSeconds = (durationMinutes * 60) / totalSets;
    const timerId = setInterval(() => {
      if (restingRef.current) {
        setRestSecondsLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            restingRef.current = false;
            currentSetRef.current = Math.min(totalSets, currentSetRef.current + 1);
            setResting(false);
            setCurrentSet(currentSetRef.current);
            onEquipmentReserve?.();
            return 0;
          }
          return next;
        });
      } else {
        setElapsedSecondsRef.current += 1;
        if (setElapsedSecondsRef.current >= perSetSeconds && currentSetRef.current < totalSets) {
          setElapsedSecondsRef.current = 0;
          restingRef.current = true;
          setResting(true);
          setRestSecondsLeft(60);
          onEquipmentRelease?.();
        }
      }
    }, 1000);
    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, totalSets, durationMinutes]);

  const handleFinish = async () => {
    if (!sessionId) return;
    try {
      await finishLiveSession(sessionId, studentId);
      if (pollRef.current) clearInterval(pollRef.current);
      onFinished();
    } catch (err) {
      console.error("Error finishing live session:", err);
      setError(err instanceof Error ? err.message : "Couldn't finish the session.");
    }
  };

  if (starting) {
    return <div style={{ marginTop: 14, fontSize: 13, color: "#667085" }}>Running pre-session check...</div>;
  }

  if (!sessionId) {
    return (
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {preSessionCheck && !preSessionCheck.clearedToStart && (
          <div style={{ fontSize: 13, color: "#B42318" }}>
            Pre-session check ({preSessionCheck.systolic}/{preSessionCheck.diastolic}) didn't clear — session wasn't started.
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "#B42318" }}>{error}</div>}
        <button type="button" onClick={onCancel} style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 8, border: "1px solid #D0D5DD", background: "#fff", color: "#344054", fontSize: 13, fontWeight: 600 }}>
          Close
        </button>
      </div>
    );
  }

  const phaseStyle = PHASE_STYLES[reading?.phase ?? "WARMUP"];
  const hrReading = reading?.readings.find((r) => r.dataTypeName === "com.google.heart_rate.bpm");
  const stepsReading = reading?.readings.find((r) => r.dataTypeName === "com.google.step_count.delta");
  const repsReading = reading?.readings.find((r) => r.dataTypeName === "com.example.rep_count.delta");
  const caloriesReading = reading?.readings.find((r) => r.dataTypeName === "com.google.calories.expended");
  const movementReading = stepsReading ?? repsReading;

  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = startedAtMillis.current ? (Date.now() - startedAtMillis.current) / 1000 : 0;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const timerDisplay = formatTimer(remainingSeconds);

  const points = heartRateHistory
    .map((v, i) => {
      const x = (i / Math.max(1, heartRateHistory.length - 1)) * 220;
      const y = 64 - Math.min(56, Math.max(0, (v - 60) / 1.4));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #E4E7EC", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#101828" }}>{exerciseName}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: remainingSeconds <= 0 ? "#98A2B3" : "#344054", fontVariantNumeric: "tabular-nums" }}>
            {timerDisplay}
          </span>
          {totalSets > 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, background: "#F2F4F7", color: "#344054" }}>
              Set {currentSet} / {totalSets}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, background: phaseStyle.bg, color: phaseStyle.color }}>
          {phaseStyle.label}
        </span>
      </div>

      {resting && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#ECF3FF", border: "1px solid #D1E0FF" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#3641F5" }}>
            Resting &mdash; back to set {currentSet + 1} of {totalSets} in {formatTimer(restSecondsLeft)}
          </span>
          <span style={{ fontSize: 12, color: "#3641F5" }}>Equipment freed up for the break</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: phaseStyle.color, lineHeight: 1 }}>
          HR : {hrReading ? Math.round(hrReading.value) : "--"}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#98A2B3" }}> bpm</span>
        </div>
        <svg viewBox="0 0 220 64" style={{ flex: 1, minWidth: 160, height: 64 }} role="img" aria-label="Heart rate trend">
          <polyline points={points} fill="none" stroke={phaseStyle.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#98A2B3", fontWeight: 600, textTransform: "uppercase" }}>
            {stepsReading ? "Steps" : "Reps"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#101828" }}>
            {movementReading ? Math.round(movementReading.value) : 0}
          </div>
        </div>
        <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#98A2B3", fontWeight: 600, textTransform: "uppercase" }}>Calories</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#101828" }}>
            {caloriesReading ? caloriesReading.value.toFixed(1) : "0.0"} kcal
          </div>
        </div>
      </div>

      <button type="button" onClick={handleFinish} style={{ alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, border: "none", background: "#465FFF", color: "#fff", fontSize: 13, fontWeight: 600 }}>
        Finish
      </button>

      {error && <div style={{ fontSize: 13, color: "#B42318" }}>{error}</div>}
    </div>
  );
}