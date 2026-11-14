import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import EquipmentBoard from "./EquipmentBoard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { useWorkout } from "../../context/WorkoutContext";
import {
  fetchEquipment,
  fetchCoaches,
  fetchMyCoach,
  subscribeToCoach,
  changeCoach,
  fetchPendingRequests,
  createSessionRequest,
  optimizeSchedule,
  checkInEquipment,
  checkOutEquipment,
  fetchRecoveryEvents,
} from "../../api/resourceSchedulerApi";
import {
  EquipmentDto,
  CoachSummary,
  MyCoachDto,
  SessionRequestDto,
  OptimizeScheduleResponse,
  RecoveryEventDto,
} from "../../types/resourceScheduler";
import { fetchCurrentWeeklyPlan, setWeeklyPlanItemCompleted } from "../../api/weeklyPlannerApi";
import { DAYS, DAY_LABELS, Day, PlannedExercise, WeeklyPlanResponse } from "../../types/weeklyPlanner";
import { difficultyTier, TIER_BADGE_COLOR } from "../../types/exerciseGraph";
import Badge from "../../components/ui/badge/Badge";
import LiveSessionPage from "../LiveSession/LiveSessionPage";

function formatPlanTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Same severity palette used elsewhere in the app's dataviz-informed
// components (Meter in SmartMealPlanner.tsx) - reused here for the small
// stat tiles below so the two feel like one design system.
const STAT_STYLE = {
  accepted: { bg: "#d1fadf", text: "#067647" },
  rejected: { bg: "#fee4e2", text: "#b42318" },
  neutral: { bg: "#ecf3ff", text: "#2970ff" },
};

function StatTile({ label, value, tone }: { label: string; value: string | number; tone: keyof typeof STAT_STYLE }) {
  const style = STAT_STYLE[tone];
  return (
    <div className="flex-1 min-w-[140px] rounded-xl p-4" style={{ backgroundColor: style.bg }}>
      <div className="text-xs font-medium" style={{ color: style.text }}>{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: style.text }}>{value}</div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Labels each of the 4 parallel loadAll() calls so a failure says exactly
// which one broke and why, instead of one generic message - this is what
// you read if the page ever shows an error again, no DevTools needed.
type LoadStep = "equipment" | "coaches" | "myCoach" | "pending";
const STEP_LABEL: Record<LoadStep, string> = {
  equipment: "equipment list",
  coaches: "coach list",
  myCoach: "your coach",
  pending: "pending requests",
};

export default function ResourceSchedulerPage() {
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [coaches, setCoaches] = useState<CoachSummary[]>([]);
  const [myCoach, setMyCoach] = useState<MyCoachDto | null>(null);
  const [pending, setPending] = useState<SessionRequestDto[]>([]);
  const [recoveryEvents, setRecoveryEvents] = useState<RecoveryEventDto[]>([]);
const { setFormData } = useWorkout();
  // "My Coach" subscribe/change flow - price is typed in here because there
  // is no fixed coach-price catalog yet (see CoachSubscriptionService).
  const [pickingCoach, setPickingCoach] = useState(false);
  const [coachChoice, setCoachChoice] = useState<number | null>(null);
  const [priceChoice, setPriceChoice] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastRequestSummary, setLastRequestSummary] = useState<{ requested: number; cappedForRisk: number } | null>(null);
  // Per-exercise request state, keyed by weekly-plan itemId - lets each row
  // in "Book a session" show its own Request/Requesting.../Requested button
  // independently of the others, instead of only an all-or-nothing bulk
  // request. Also doubles as the fix for the old duplicate-booking gap:
  // once an item is "requested" (via its own button OR because it was part
  // of a bulk batch that succeeded), the bulk button no longer re-sends it.
  const [itemRequestStatus, setItemRequestStatus] = useState<
    Record<number, "submitting" | "requested" | "error">
  >({});

  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeScheduleResponse | null>(null);

  // "Which day of your weekly plan" - the saved plan itself (read-only
  // here; it's only ever generated/regenerated from the Smart Weekly
  // Planner page) plus which day the student picked to look at.
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  // Which weekly-plan item, if any, currently has its Live Session open.
  // Only one at a time - the Start button on every other row hides itself
  // while this is set (see the render below).
  const [liveItemId, setLiveItemId] = useState<number | null>(null);

  // Non-blocking heads-up when an automatic Live Equipment Board
  // check-in/reserve (below) fails - e.g. the equipment's already at
  // capacity, or someone else grabbed it during a rest break. Never stops
  // the live session itself; it's only the board sync that failed.
  const [equipmentNotice, setEquipmentNotice] = useState<string | null>(null);

  const studentId = Number(Cookies.get("userId"));

  const loadAll = async () => {
    setLoading(true);
    const steps: { key: LoadStep; run: () => Promise<void> }[] = [
      { key: "equipment", run: async () => setEquipment(await fetchEquipment()) },
      { key: "coaches", run: async () => setCoaches(await fetchCoaches()) },
      { key: "myCoach", run: async () => setMyCoach(await fetchMyCoach(studentId)) },
      { key: "pending", run: async () => setPending(await fetchPendingRequests()) },
    ];
    const results = await Promise.allSettled(steps.map((s) => s.run()));
    const errors: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.error(`Error loading ${STEP_LABEL[steps[i].key]}:`, r.reason);
        errors.push(`Couldn't load ${STEP_LABEL[steps[i].key]}: ${reason}`);
      }
    });
    setLoadErrors(errors);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recovery events: when a coach cancels one of this student's ACCEPTED
  // sessions, the backend kicks off an automatic replacement search
  // (RecoveryService) and records a RecoveryEvent. There's no websocket
  // subscription wired up on this page, so a short poll is how the
  // in-progress -> resolved/failed transition actually reaches the UI -
  // same "poll every few seconds" pattern already used elsewhere in this
  // app (e.g. the Live Equipment Board) rather than exclusively relying on
  // the /topic/notifications STOMP broadcast.
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const events = await fetchRecoveryEvents(studentId);
        if (!cancelled) setRecoveryEvents(events);
      } catch (err) {
        console.error("Error fetching recovery updates:", err);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [studentId]);

  // Separate from loadAll() on purpose: no saved plan yet is a normal,
  // expected state here (not every student has used Smart Weekly Planner),
  // so it's never added to loadErrors - it just leaves weeklyPlan null and
  // the card below shows its own "go generate one" message instead.
  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const plan = await fetchCurrentWeeklyPlan(studentId);
        setWeeklyPlan(plan);
      } catch (err) {
        console.error("Error fetching weekly plan:", err);
      }
    })();
  }, []);
  
function buildEquipmentReservationMessage(items: PlannedExercise[]): string | null {
  const withEquipment = items.filter((i) => i.equipmentName && i.startTime && i.endTime);
  if (withEquipment.length === 0) return null;

  const parts = withEquipment.map(
    (i) => `${i.equipmentName} (${formatPlanTime(i.startTime!)}–${formatPlanTime(i.endTime!)})`
  );
  return `Reserved for you today: ${parts.join(", ")}`;
}
  const handleToggleCompleted = async (item: PlannedExercise, nextCompleted: boolean) => {
    if (!weeklyPlan || !selectedDay) return;

    // Optimistic update - the checkbox flips immediately; only rolled back
    // if the PATCH itself fails (see catch below).
    setWeeklyPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        planByDay: {
          ...prev.planByDay,
          [selectedDay]: prev.planByDay[selectedDay].map((i) =>
            i.itemId === item.itemId ? { ...i, completed: nextCompleted } : i
          ),
        },
      };
    });

    try {
      await setWeeklyPlanItemCompleted(item.itemId, studentId, nextCompleted);
    } catch (err) {
      console.error("Error updating exercise status:", err);
      setWeeklyPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          planByDay: {
            ...prev.planByDay,
            [selectedDay]: prev.planByDay[selectedDay].map((i) =>
              i.itemId === item.itemId ? { ...i, completed: !nextCompleted } : i
            ),
          },
        };
      });
    }
  };

  const handleConfirmCoach = async () => {
    if (!coachChoice) return;
    const price = Number(priceChoice);
    if (!priceChoice || Number.isNaN(price) || price <= 0) {
      setSubscribeError("Enter a valid monthly price.");
      return;
    }
    setSubscribing(true);
    setSubscribeError(null);
    try {
      if (myCoach?.assigned && myCoach.cartId) {
        await changeCoach(myCoach.cartId, studentId, coachChoice, price);
      } else {
        await subscribeToCoach(studentId, coachChoice, price);
      }
      setMyCoach(await fetchMyCoach(studentId));
      setPickingCoach(false);
      setCoachChoice(null);
      setPriceChoice("");
    } catch (err) {
      console.error("Error subscribing to coach:", err);
      setSubscribeError(err instanceof Error ? err.message : "Failed to subscribe to that coach.");
    } finally {
      setSubscribing(false);
    }
  };

  // Resolves a weekly-plan item's equipment NAME (a free-text label, same
  // as Exercise.equipment_required) to the real Equipment row's id, using
  // the equipment list this page already loaded - same case-insensitive
  // match EquipmentAvailabilityService itself does server-side. Returns
  // null for a bodyweight exercise (no equipment name) or, defensively, if
  // nothing matches (shouldn't happen - the Weekly Planner only ever sets
  // equipmentName from a real Equipment row in the first place).
  const resolveEquipmentId = (name: string | null): number | null => {
    if (!name) return null;
    const match = equipment.find((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase());
    return match ? match.equipmentId : null;
  };

  // Starting a weekly-plan exercise that needs tracked equipment (e.g.
  // Bulgarian Split Squat -> Flat Bench) also checks that equipment in on
  // the Live Equipment Board automatically, via the same /api/equipment/
  // {id}/checkin endpoint the board's own "Start using" button calls - so
  // the student doesn't have to separately walk over to the board and
  // check in by hand. Bodyweight exercises (no equipmentName) skip this
  // entirely. The live session itself always opens regardless of whether
  // the check-in succeeds - a full-capacity or already-checked-in equipment
  // error is surfaced as a dismissible notice, not a blocker.
  const handleStartItem = async (item: PlannedExercise) => {
    setLiveItemId(item.itemId);
    setEquipmentNotice(null);
    const equipmentId = resolveEquipmentId(item.equipmentName);
    if (equipmentId == null) return;
    try {
      await checkInEquipment(equipmentId, studentId);
    } catch (err) {
      console.error("Error auto-checking in equipment:", err);
      setEquipmentNotice(
        `Started ${item.name}, but couldn't check in ${item.equipmentName} on the Live Equipment Board` +
          (err instanceof Error ? `: ${err.message}` : ".")
      );
    }
  };

  // Mirrors handleStartItem on the way out - finishing OR cancelling the
  // live session checks the same equipment back out, so it never sits
  // marked "in use" on the board after the student is actually done with
  // it. Failures here are logged only, not shown - if the check-in above
  // never succeeded (or the student already checked out manually), there's
  // nothing left to undo.
  const handleEndItem = async (item: PlannedExercise) => {
    const equipmentId = resolveEquipmentId(item.equipmentName);
    if (equipmentId != null) {
      try {
        await checkOutEquipment(equipmentId, studentId);
      } catch (err) {
        console.error("Error auto-checking out equipment:", err);
      }
    }
    setLiveItemId(null);
  };

  // Mid-workout rest breaks between sets (LiveSessionPage's own set/rest
  // timer - its `sets` prop below) - frees the equipment the instant a
  // rest starts, same idea as handleEndItem but without closing the live
  // session. Failures are logged only; nothing was checked in yet to undo.
  const handleEquipmentRelease = async (item: PlannedExercise) => {
    const equipmentId = resolveEquipmentId(item.equipmentName);
    if (equipmentId == null) return;
    try {
      await checkOutEquipment(equipmentId, studentId);
    } catch (err) {
      console.error("Error releasing equipment for rest:", err);
    }
  };

  // Mirrors handleEquipmentRelease on the way back in - fires the moment
  // the next set begins. Unlike the release side, a failure here is worth
  // surfacing: since the equipment was genuinely freed during the break,
  // someone else may have picked it up (or moved up the queue) in the
  // meantime, so the student needs to know their spot isn't guaranteed
  // just because the rest timer ran out.
  const handleEquipmentReserve = async (item: PlannedExercise) => {
    const equipmentId = resolveEquipmentId(item.equipmentName);
    if (equipmentId == null) return;
    try {
      await checkInEquipment(equipmentId, studentId);
    } catch (err) {
      console.error("Error re-reserving equipment after rest:", err);
      setEquipmentNotice(
        `Couldn't reserve ${item.equipmentName} again after the rest for ${item.name}` +
          (err instanceof Error ? `: ${err.message}` : ".") +
          " Someone else may have taken it - check the Live Equipment Board."
      );
    }
  };

  // Books ONE coached session for a single exercise - the per-row "Request"
  // button in "Book a session". Uses the exact start/end time
  // EquipmentAvailabilityService already worked out when the weekly plan
  // was generated, same as the bulk path below, just scoped to one item.
  const handleRequestSingleSession = async (item: PlannedExercise) => {
    if (!myCoach?.assigned) {
      setSubmitError("Subscribe to a coach above before requesting sessions.");
      return;
    }
    setItemRequestStatus((prev) => ({ ...prev, [item.itemId]: "submitting" }));
    setSubmitError(null);
    try {
      await createSessionRequest({
        studentId,
        equipmentId: resolveEquipmentId(item.equipmentName),
        startTime: item.startTime as string,
        endTime: item.endTime as string,
      });
      setItemRequestStatus((prev) => ({ ...prev, [item.itemId]: "requested" }));
      const pendingList = await fetchPendingRequests();
      setPending(pendingList);
    } catch (err) {
      console.error("Error requesting session:", err);
      setItemRequestStatus((prev) => ({ ...prev, [item.itemId]: "error" }));
      setSubmitError(err instanceof Error ? err.message : `Couldn't request a session for ${item.name}.`);
    }
  };

  // Books one coached session PER exercise still scheduled for the picked
  // day (whichever items are left unchecked and actually got a real time -
  // see the filter in the render below), instead of the student typing in
  // an equipment and a time window by hand. Each one uses the exact
  // start/end time EquipmentAvailabilityService already worked out when
  // the weekly plan was generated. The caller (render below) only ever
  // passes items that haven't already been individually requested, so this
  // never double-books something the per-row button already sent.
  const handleRequestDaySessions = async (items: PlannedExercise[]) => {
    setSubmitting(true);
    setSubmitError(null);
    setLastRequestSummary(null);
    setItemRequestStatus((prev) => {
      const next = { ...prev };
      items.forEach((i) => { next[i.itemId] = "submitting"; });
      return next;
    });
    try {
      if (!myCoach?.assigned) {
        throw new Error("Subscribe to a coach above before requesting sessions.");
      }
      const results = await Promise.allSettled(
        items.map((item) =>
          createSessionRequest({
            studentId,
            equipmentId: resolveEquipmentId(item.equipmentName),
            startTime: item.startTime as string,
            endTime: item.endTime as string,
          })
        )
      );
      setItemRequestStatus((prev) => {
        const next = { ...prev };
        results.forEach((r, i) => {
          next[items[i].itemId] = r.status === "fulfilled" ? "requested" : "error";
        });
        return next;
      });
      const succeeded = results.filter(
        (r): r is PromiseFulfilledResult<SessionRequestDto> => r.status === "fulfilled"
      );
      const failed = results.length - succeeded.length;
      const cappedForRisk = succeeded.filter((r) => r.value.cappedForRisk).length;
      setLastRequestSummary({ requested: succeeded.length, cappedForRisk });
      if (failed > 0) {
        setSubmitError(`${failed} of ${items.length} session${items.length === 1 ? "" : "s"} couldn't be requested - try again.`);
      }
      const pendingList = await fetchPendingRequests();
      setPending(pendingList);
    } catch (err) {
      console.error("Error requesting day sessions:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to request sessions.");
      // The guard above throws before any request goes out, so undo the
      // optimistic "submitting" marks rather than leaving them stuck.
      setItemRequestStatus((prev) => {
        const next = { ...prev };
        items.forEach((i) => { if (next[i.itemId] === "submitting") delete next[i.itemId]; });
        return next;
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptimizeError(null);
    setResult(null);
    try {
      const res = await optimizeSchedule();
      setResult(res);
      setPending([]); // every PENDING request just got flipped to ACCEPTED/REJECTED
    } catch (err) {
      console.error("Error optimizing schedule:", err);
      setOptimizeError("Failed to optimize the schedule.");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Trainer & Equipment Scheduler | Fitness - Admin Dashboard Template"
        description="Book sessions with your coach and shared equipment, then run an exact Branch & Bound optimizer to resolve conflicts"
      />
      <PageBreadcrumb pageTitle="Trainer & Equipment Scheduler" />
      <div className="space-y-6">
        {loading ? (
          <ComponentCard title="Trainer & Equipment Scheduler">
            <div className="p-5">Loading...</div>
          </ComponentCard>
        ) : loadErrors.length > 0 ? (
          <ComponentCard title="Trainer & Equipment Scheduler">
            <div className="p-5 space-y-2">
              {loadErrors.map((e, i) => (
                <div key={i} className="text-error-500 text-sm">{e}</div>
              ))}
              <Button onClick={loadAll}>Retry</Button>
            </div>
          </ComponentCard>
        ) : (
          <>
            <ComponentCard
              title="My Weekly Plan"
              desc="Pick a day from your saved Smart Weekly Planner schedule and check off each exercise as you go."
            >
              {!weeklyPlan ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  You haven&apos;t generated a weekly plan yet - head to Smart Weekly Planner to create one, then
                  come back here to check off each day's exercises.
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {DAYS.map((day) => {
                      const items = weeklyPlan.planByDay[day] ?? [];
                      const selected = selectedDay === day;
                      return (
                        <button
                          key={day}
                          type="button"
  onClick={() => {
    setSelectedDay(day);
    const items = weeklyPlan.planByDay[day] ?? [];
    const message = buildEquipmentReservationMessage(items);
    if (message) {
      setFormData((prev) => ({ ...prev, equipmentReservationMessage: message }));
    }
  }}
                          className={`px-4 py-2 rounded-full text-sm font-medium border ${
                            selected
                              ? "bg-brand-500 text-white border-brand-500"
                              : "bg-white text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          {DAY_LABELS[day]}
                          {items.length > 0 && (
                            <span className={`ml-1.5 text-xs ${selected ? "text-white/80" : "text-gray-400"}`}>
                              ({items.length})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!selectedDay ? (
                    <div className="text-sm text-gray-400 italic">Choose a day above to see its schedule.</div>
                  ) : (
                    (() => {
                      const items: PlannedExercise[] = weeklyPlan.planByDay[selectedDay] ?? [];
                      if (items.length === 0) {
                        return <div className="text-sm text-gray-400 italic">Nothing scheduled for {DAY_LABELS[selectedDay]}.</div>;
                      }
                      const doneCount = items.filter((i) => i.completed).length;
                      return (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {doneCount} / {items.length} done
                          </div>
                          {equipmentNotice && (
                            <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-warning-200 bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/10 p-3 text-xs text-warning-700 dark:text-warning-400">
                              <span>{equipmentNotice}</span>
                              <button
                                type="button"
                                onClick={() => setEquipmentNotice(null)}
                                className="shrink-0 font-medium underline"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            {items.map((item) => {
                              const tier = difficultyTier(item.value);
                              return (
                                <div
                                  key={item.itemId}
                                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                                    item.completed
                                      ? "border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10"
                                      : "border-gray-200 dark:border-white/[0.05]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    aria-label={`Mark ${item.name} done`}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    checked={item.completed}
                                    onChange={(e) => handleToggleCompleted(item, e.target.checked)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-sm font-medium ${
                                          item.completed
                                            ? "text-gray-400 line-through"
                                            : "text-gray-800 dark:text-white/90"
                                        }`}
                                      >
                                        {item.name}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {!item.completed && liveItemId === null && (
                                          <button
                                            type="button"
                                            onClick={() => handleStartItem(item)}
                                            className="text-xs font-medium text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 rounded-full px-3 py-1.5 whitespace-nowrap"
                                          >
                                            Start
                                          </button>
                                        )}
                                        <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>Lv{item.value}</Badge>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {item.startTime && item.endTime
                                        ? `${formatPlanTime(item.startTime)}–${formatPlanTime(item.endTime)}`
                                        : item.schedulingNote
                                          ? item.schedulingNote
                                          : `${item.durationMinutes} min`}
                                      {item.equipmentName && <span> &middot; {item.equipmentName}</span>}
                                    </div>

                                    {liveItemId === item.itemId && (
                                      <LiveSessionPage
                                        itemId={item.itemId}
                                        exerciseName={item.name}
                                        durationMinutes={item.durationMinutes}
                                        difficultyLevel={item.value}
                                        sets={item.sets}
                                        onEquipmentRelease={() => handleEquipmentRelease(item)}
                                        onEquipmentReserve={() => handleEquipmentReserve(item)}
                                        onFinished={() => {
                                          handleToggleCompleted(item, true);
                                          handleEndItem(item);
                                        }}
                                        onCancel={() => handleEndItem(item)}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </ComponentCard>

            <ComponentCard
              title="My Coach"
              desc="Your private coach is a monthly subscription, not a per-session charge - it applies automatically to every session you book below. You can have one active coach at a time."
            >
              {myCoach?.assigned && !pickingCoach ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-brand-200 to-brand-300 flex items-center justify-center font-bold text-brand-800 text-base shrink-0">
                    {initials(myCoach.name ?? "")}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white/90 text-[15px]">{myCoach.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-success-600 bg-success-50 dark:bg-success-500/15 rounded-full px-2 py-0.5">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white/90">
                      ${myCoach.monthlyPrice}
                      <span className="text-sm font-semibold text-gray-400">/month</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setPickingCoach(true)}>
                    Change Coach
                  </Button>
                </div>
              ) : (
                <div>
                  {!myCoach?.assigned && !pickingCoach && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      You don&apos;t have a coach yet - pick one below to start booking sessions.
                    </div>
                  )}
                  {(pickingCoach || !myCoach?.assigned) && (
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="min-w-[220px]">
                        <Label>Coach</Label>
                        <Select
                          options={coaches.map((c) => ({
                            value: String(c.coachId),
                            label: c.name,
                          }))}
                          defaultValue=""
                          onChange={(v) => setCoachChoice(v ? Number(v) : null)}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Monthly price ($)</Label>
                        <Input
                          type="number"
                          value={priceChoice}
                          onChange={(e) => setPriceChoice(e.target.value)}
                          placeholder="e.g. 150"
                        />
                      </div>
                      <Button onClick={handleConfirmCoach} disabled={!coachChoice || subscribing}>
                        {subscribing ? "Saving..." : myCoach?.assigned ? "Confirm Change" : "Subscribe"}
                      </Button>
                      {pickingCoach && (
                        <Button variant="outline" onClick={() => { setPickingCoach(false); setCoachChoice(null); setPriceChoice(""); }}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                  {subscribeError && <div className="text-error-500 text-sm mt-2">{subscribeError}</div>}
                </div>
              )}
            </ComponentCard>

            <EquipmentBoard />

            <ComponentCard
              title="Book a session"
              desc={
                myCoach?.assigned
                  ? `Pick a day in "My Weekly Plan" above, then request a coached session with ${myCoach.name} for every exercise still scheduled that day - using the real times and equipment your weekly plan already worked out, no manual entry needed.`
                  : "Subscribe to a coach above first - every session is booked with your one assigned coach."
              }
            >
              {!selectedDay ? (
                <div className="text-sm text-gray-400 italic">
                  Pick a day in &quot;My Weekly Plan&quot; above to request sessions for it.
                </div>
              ) : (
                (() => {
                  const dayItems: PlannedExercise[] = weeklyPlan?.planByDay[selectedDay] ?? [];
                  const bookable = dayItems.filter((i) => i.startTime && i.endTime && !i.completed);
                  const alreadyDone = dayItems.filter((i) => i.completed).length;
                  const noTime = dayItems.filter((i) => !i.startTime || !i.endTime).length;
                  // Items still worth sending in the bulk batch - leaves out
                  // anything already requested (one at a time above, or in
                  // an earlier bulk click), so "Request all" never re-sends
                  // the same exercise twice.
                  const requestableNow = bookable.filter((i) => itemRequestStatus[i.itemId] !== "requested");

                  if (dayItems.length === 0) {
                    return (
                      <div className="text-sm text-gray-400 italic">
                        Nothing scheduled for {DAY_LABELS[selectedDay]} - rest day, or you haven&apos;t generated a
                        weekly plan yet.
                      </div>
                    );
                  }
                  if (bookable.length === 0) {
                    return (
                      <div className="text-sm text-gray-400 italic">
                        Nothing left to request for {DAY_LABELS[selectedDay]}
                        {alreadyDone > 0
                          ? " - every exercise is already checked off."
                          : noTime > 0
                            ? " - none of today's exercises got a real time slot."
                            : "."}
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05] mb-4">
                        {bookable.map((item) => {
                          const status = itemRequestStatus[item.itemId];
                          return (
                            <div key={item.itemId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 dark:text-white/90">{item.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {formatPlanTime(item.startTime!)}&ndash;{formatPlanTime(item.endTime!)}
                                  {item.equipmentName && <span> &middot; {item.equipmentName}</span>}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {status === "requested" ? (
                                  <span className="text-xs font-semibold text-success-600 bg-success-50 dark:bg-success-500/15 dark:text-success-400 rounded-full px-3 py-1.5 whitespace-nowrap">
                                    Requested
                                  </span>
                                ) : status === "submitting" ? (
                                  <span className="text-xs text-gray-400 px-3 py-1.5 whitespace-nowrap">
                                    Requesting...
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestSingleSession(item)}
                                    disabled={!myCoach?.assigned}
                                    className="text-xs font-medium text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 rounded-full px-3 py-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {status === "error" ? "Retry" : "Request"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {requestableNow.length > 0 ? (
                        <Button
                          onClick={() => handleRequestDaySessions(requestableNow)}
                          disabled={submitting || !myCoach?.assigned}
                        >
                          {submitting
                            ? "Requesting..."
                            : `Request all ${requestableNow.length} remaining session${requestableNow.length === 1 ? "" : "s"} for ${DAY_LABELS[selectedDay]}`}
                        </Button>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          Every open exercise for {DAY_LABELS[selectedDay]} has already been requested above.
                        </div>
                      )}
                    </>
                  );
                })()
              )}
              {submitError && <div className="text-error-500 text-sm mt-3">{submitError}</div>}
              {lastRequestSummary && (
                <div className="rounded-xl border border-success-200 bg-success-50 text-success-600 dark:border-success-500/30 dark:bg-success-500/15 text-sm p-3 mt-3">
                  Requested {lastRequestSummary.requested} session{lastRequestSummary.requested === 1 ? "" : "s"}.
                  {lastRequestSummary.cappedForRisk > 0 && (
                    <>
                      {" "}
                      {lastRequestSummary.cappedForRisk} of them{" "}
                      {lastRequestSummary.cappedForRisk === 1 ? "was" : "were"} shortened to match your current
                      risk-based session ceiling.
                    </>
                  )}
                </div>
              )}
            </ComponentCard>

            {recoveryEvents.length > 0 && (
              <ComponentCard
                title="Recovery updates"
                desc="When a coach cancels one of your accepted sessions, we automatically look for a replacement coach at the same time"
              >
                <div className="flex flex-col gap-3">
                  {recoveryEvents.map((e) => {
                    const tone =
                      e.status === "PROCESSING" ? "warning" : e.status === "COMPLETED" ? "success" : "error";
                    return (
                      <div
                        key={e.eventId}
                        className={
                          tone === "warning"
                            ? "rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10"
                            : tone === "success"
                            ? "rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/30 dark:bg-success-500/10"
                            : "rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10"
                        }
                      >
                        <div className="flex items-start gap-3">
                          {e.status === "PROCESSING" && (
                            <span className="mt-0.5 h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-warning-200 border-t-warning-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={
                                tone === "warning"
                                  ? "text-sm font-semibold text-warning-600"
                                  : tone === "success"
                                  ? "text-sm font-semibold text-success-600"
                                  : "text-sm font-semibold text-error-600"
                              }
                            >
                              {e.status === "PROCESSING" &&
                                `Finding a replacement${e.startTime ? ` for your ${formatDateTime(e.startTime)} session` : ""}`}
                              {e.status === "COMPLETED" &&
                                `Session reassigned${e.newCoachName ? ` to ${e.newCoachName}` : ""}`}
                              {e.status === "FAILED" && "Couldn't find a replacement"}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                              {e.oldCoachName ? `${e.oldCoachName} cancelled` : "Your coach cancelled"}
                              {e.equipmentName ? ` · ${e.equipmentName}` : ""}
                              {e.startTime && e.endTime
                                ? ` · ${formatDateTime(e.startTime)} → ${formatDateTime(e.endTime)}`
                                : ""}
                              {e.message ? ` — ${e.message}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ComponentCard>
            )}

            <ComponentCard
              title="Pending requests"
              desc={`${pending.length} request${pending.length === 1 ? "" : "s"} waiting to be resolved`}
            >
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pending.map((r) => (
                  <div key={r.requestId} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{r.studentName}</span>
                      <span className="text-gray-400"> with </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{r.coachName}</span>
                      {r.equipmentName && <span className="text-gray-400"> &middot; {r.equipmentName}</span>}
                      {r.cappedForRisk && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-warning-600 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400 rounded-full px-2 py-0.5">
                          risk-capped
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDateTime(r.startTime)} &rarr; {formatDateTime(r.endTime)}</span>
                    </div>
                  </div>
                ))}
                {pending.length === 0 && (
                  <div className="py-4 text-sm text-gray-400 italic">No pending requests right now.</div>
                )}
              </div>
            </ComponentCard>

            <div className="rounded-2xl border border-[#dde9ff] bg-[#ecf3ff] p-5 flex items-center justify-between gap-4 flex-wrap dark:border-brand-800 dark:bg-brand-950">
              <p className="text-sm text-brand-600 dark:text-brand-300 max-w-3xl">
                Two independently-shared resources (coaches AND equipment) means conflicts no longer form a simple
                interval graph - unlike the Weekly Planner, there's no known polynomial exact algorithm for this.
                Since coach pricing is a flat monthly fee rather than a per-session price, this searches for the
                largest conflict-free set of sessions it can accept - still an exact Branch &amp; Bound search, still
                NP-hard, just no longer weighted by revenue. Whichever of your own requests gets accepted becomes a
                booked time slot the Weekly Planner reads automatically the next time you generate your week.
              </p>
              <Button onClick={handleOptimize} disabled={optimizing || pending.length === 0}>
                {optimizing ? "Optimizing..." : "Optimize Schedule"}
              </Button>
            </div>

            {optimizeError && <div className="text-error-500">{optimizeError}</div>}

            {result && (
              <>
                <ComponentCard title="Optimization result">
                  <div className="flex gap-4 flex-wrap">
                    <StatTile label="Accepted" value={result.acceptedSessions.length} tone="accepted" />
                    <StatTile label="Rejected" value={result.rejectedSessions.length} tone="rejected" />
                    <StatTile label="Requests considered" value={result.requestsConsidered} tone="neutral" />
                    <StatTile label="Search nodes explored" value={result.nodesExplored} tone="neutral" />
                  </div>
                </ComponentCard>

                <ComponentCard title="Accepted sessions">
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {result.acceptedSessions.map((r) => (
                      <div key={r.requestId} className="flex items-center justify-between py-2.5 text-sm">
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-white/90">{r.studentName}</span>
                          <span className="text-gray-400"> with </span>
                          <span className="font-semibold text-gray-800 dark:text-white/90">{r.coachName}</span>
                          {r.equipmentName && <span className="text-gray-400"> &middot; {r.equipmentName}</span>}
                          {r.cappedForRisk && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-warning-600 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400 rounded-full px-2 py-0.5">
                              risk-capped
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDateTime(r.startTime)} &rarr; {formatDateTime(r.endTime)}</span>
                        </div>
                      </div>
                    ))}
                    {result.acceptedSessions.length === 0 && (
                      <div className="py-4 text-sm text-gray-400 italic">Nothing was accepted this round.</div>
                    )}
                  </div>
                </ComponentCard>

                {result.rejectedSessions.length > 0 && (
                  <ComponentCard title="Rejected sessions">
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {result.rejectedSessions.map((r) => (
                        <div key={r.requestId} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-gray-400 line-through">
                            {r.studentName} with {r.coachName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(r.startTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ComponentCard>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}