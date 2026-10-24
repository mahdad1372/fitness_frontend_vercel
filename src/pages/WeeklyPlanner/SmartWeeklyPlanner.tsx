import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { fetchAllExercises } from "../../api/exerciseGraphApi";
import { generateWeeklyPlan, fetchCurrentWeeklyPlan } from "../../api/weeklyPlannerApi";
import { Exercise, difficultyTier, TIER_BADGE_COLOR } from "../../types/exerciseGraph";
import { DAYS, DAY_LABELS, Day, PlannedExercise, WeeklyPlanResponse } from "../../types/weeklyPlanner";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Only the plan's OUTPUT is saved to the database, not the daily-budget
// inputs that produced it - so when a saved plan is restored on page load,
// there's no real "budget" to show per day. This stands in for it (budget
// shown = minutes actually used that day), which also makes the "Rest day"
// vs "Nothing scheduled" distinction below come out right: a day with no
// saved items shows as Rest, exactly like a freshly generated 0-budget day
// would.
function minutesUsedByDay(plan: WeeklyPlanResponse): Record<Day, number> {
  return Object.fromEntries(
    DAYS.map((d) => [d, (plan.planByDay[d] ?? []).reduce((sum, i) => sum + i.durationMinutes, 0)])
  ) as Record<Day, number>;
}

// Defaults the date picker to next Monday - dailyBudgets' keys are iterated
// MONDAY-first, so this is the date that key actually corresponds to.
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function SmartWeeklyPlanner() {
  // Read fresh on every render (same pattern ResourceSchedulerPage.tsx
  // uses) instead of as a module-level constant. A module-level
  // `const studentId = Number(Cookies.get("userId"))` is only ever
  // evaluated ONCE, the first time this file's JS module is loaded - in a
  // single-page app that's typically once per full browser load, not once
  // per login. Logging out and back in (without a hard refresh) swaps the
  // cookie but never re-runs that top-level line, so the restore-plan
  // effect below kept reading the FIRST session's studentId (or none at
  // all) forever after. Computing it inside the component re-reads the
  // cookie every time the page mounts/renders, so a fresh login is picked
  // up correctly.
  const studentId = Number(Cookies.get("userId"));

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dailyBudgets, setDailyBudgets] = useState<Record<Day, number>>(
    () => Object.fromEntries(DAYS.map((d) => [d, 0])) as Record<Day, number>
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [weekStartDate, setWeekStartDate] = useState<string>(nextMonday());

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllExercises();
        setExercises(data);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setLoadError("Failed to load the exercise catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Restores this student's already-generated plan for the current real
  // week, if one exists - so logging out/in or just navigating away and
  // back doesn't lose it. Silent on failure (no token yet, network hiccup,
  // etc.) - worst case the page just shows its normal empty state, same as
  // a student who hasn't generated a plan yet.
  // Depends on [studentId] (not []) on purpose: if this page ever stays
  // mounted across a logout/login (rather than being remounted by the
  // router), the cookie - and therefore studentId - changes without a new
  // mount, and this needs to re-fetch for whoever is logged in now instead
  // of silently keeping the previous student's plan on screen.
  useEffect(() => {
    if (!studentId) {
      setPlan(null);
      return;
    }
    (async () => {
      try {
        const saved = await fetchCurrentWeeklyPlan(studentId);
        if (saved) {
          setPlan(saved);
          setDailyBudgets(minutesUsedByDay(saved));
        } else {
          setPlan(null);
        }
      } catch (err) {
        console.error("Error fetching saved weekly plan:", err);
      }
    })();
  }, [studentId]);

  const muscleGroupOptions = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => set.add(ex.muscle_group));
    return Array.from(set).sort();
  }, [exercises]);

  const weeklyBudget = useMemo(
    () => DAYS.reduce((sum, d) => sum + (dailyBudgets[d] || 0), 0),
    [dailyBudgets]
  );

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setPlan(null);
    try {
      const result = await generateWeeklyPlan({
        dailyBudgetMinutes: dailyBudgets,
        muscleGroups: Array.from(selectedGroups),
        weekStartDate,
        studentId,
      });
      setPlan(result);
    } catch (err) {
      console.error("Error generating weekly plan:", err);
      setGenerateError("Failed to generate a plan. Make sure at least one muscle group and one training day are selected.");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = selectedGroups.size > 0 && weeklyBudget > 0 && !generating;

  return (
    <>
      <PageMeta
        title="Smart Weekly Planner | Fitness - Admin Dashboard Template"
        description="Generate a weekly workout schedule from your available time, target muscle groups and real equipment availability"
      />
      <PageBreadcrumb pageTitle="Smart Weekly Planner" />
      <div className="space-y-6">
        {loading ? (
          <ComponentCard title="Smart Weekly Planner">
            <div className="p-5">Loading...</div>
          </ComponentCard>
        ) : loadError ? (
          <ComponentCard title="Smart Weekly Planner">
            <div className="p-5 text-error-500">{loadError}</div>
          </ComponentCard>
        ) : (
          <>
            <ComponentCard
              title="Week starting"
              desc="The Monday this plan is for - each exercise's time gets checked against real equipment bookings on these actual dates."
            >
              <div className="flex flex-col gap-2 w-[200px]">
                <Label htmlFor="week-start-date">Monday</Label>
                <Input
                  id="week-start-date"
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                />
              </div>
            </ComponentCard>

            <ComponentCard
              title="Available time per day"
              desc="How many minutes can you train each day this week? Leave a day at 0 for a rest day."
            >
              <div className="flex flex-wrap gap-4">
                {DAYS.map((day) => (
                  <div key={day} className="flex flex-col gap-2 w-[110px]">
                    <Label htmlFor={`day-${day}`}>{DAY_LABELS[day].slice(0, 3)}</Label>
                    <Input
                      id={`day-${day}`}
                      type="number"
                      min="0"
                      value={dailyBudgets[day]}
                      onChange={(e) =>
                        setDailyBudgets((prev) => ({
                          ...prev,
                          [day]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Weekly time budget: <span className="font-medium text-gray-800 dark:text-white/90">{weeklyBudget} minutes</span>
              </div>
            </ComponentCard>

            <ComponentCard
              title="Target muscle groups"
              desc="Pick what you want this week's plan to focus on. Each group keeps its own easy-to-hard progression order."
            >
              <div className="flex flex-wrap gap-2">
                {muscleGroupOptions.map((group) => {
                  const selected = selectedGroups.has(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border capitalize ${
                        selected
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </ComponentCard>

            <div className="rounded-2xl border border-[#dde9ff] bg-[#ecf3ff] p-5 flex items-center justify-between gap-4 flex-wrap dark:border-brand-800 dark:bg-brand-950">
              <p className="text-sm text-brand-600 dark:text-brand-300 max-w-3xl">
                We'll filter the catalog to equipment the studio actually has (graph BFS), fix each
                group's easy-to-hard order (Kahn's topological sort), pick the best combination for
                each day's time budget while respecting that order (a constrained knapsack), then
                check real equipment bookings to give each exercise an actual start and end time.
              </p>
              <Button onClick={handleGenerate} disabled={!canGenerate}>
                {generating ? "Generating..." : "Generate My Week"}
              </Button>
            </div>

            {generateError && <div className="text-error-500">{generateError}</div>}

            {plan && (
              <ComponentCard title="Your Week">
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weekly time budget</div>
                    <div className="text-xl font-semibold text-gray-800 dark:text-white/90">{plan.weeklyBudgetMinutes} min</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time used</div>
                    <div className="text-xl font-semibold text-gray-800 dark:text-white/90">{plan.totalMinutesUsed} min</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total training value</div>
                    <div className="text-xl font-semibold text-success-600">{plan.totalValue}</div>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2">
                  {DAYS.map((day) => {
                    const items: PlannedExercise[] = plan.planByDay[day] ?? [];
                    const used = items.reduce((sum, i) => sum + i.durationMinutes, 0);
                    const budget = dailyBudgets[day] || 0;
                    return (
                      <div key={day} className="flex-1 min-w-[160px] flex flex-col gap-2">
                        <div className="pb-2 border-b border-gray-200 dark:border-white/[0.05]">
                          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{DAY_LABELS[day]}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {budget > 0 ? `${used} / ${budget} min` : "Rest"}
                          </div>
                        </div>
                        {budget === 0 || items.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-xs italic text-gray-400 py-6">
                            {budget === 0 ? "Rest day" : "Nothing scheduled"}
                          </div>
                        ) : (
                          items.map((item) => {
                            // Equipment was fully booked for the rest of the day (or
                            // there was simply no time left before closing) - the
                            // knapsack still picked this exercise, it just couldn't
                            // get a real time slot. Shown distinctly, never silently
                            // dropped, so the student knows to move it to another day.
                            if (item.schedulingNote) {
                              return (
                                <div
                                  key={item.exerciseId}
                                  className={
                                    item.completed
                                      ? "rounded-lg border border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10 p-3 border-l-[3px] border-l-error-500"
                                      : "rounded-lg border border-[#fecaca] bg-[#fef2f2] dark:border-red-900/40 dark:bg-red-950/20 p-3 border-l-[3px] border-l-error-500"
                                  }
                                >
                                  <div className="text-xs font-semibold text-error-500 mb-1">Couldn't schedule</div>
                                  <div className={`text-sm font-medium ${item.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-white/90"}`}>
                                    {item.name}
                                  </div>
                                  <div className="mt-1 text-[11px] text-error-500 leading-relaxed">{item.schedulingNote}</div>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {item.durationMinutes} min &middot; Lv{item.value} &middot; still counted
                                  </div>
                                  {item.sets != null && item.rpe != null && (
                                    <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                      {item.sets} sets &middot; RPE {item.rpe}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Checked off from the Trainer & Equipment Scheduler's "My
                            // Weekly Plan" checklist - same saved `completed` flag,
                            // just reflected here too (read-only - checking it off
                            // still only happens on that page) so a done exercise
                            // looks the same wherever the plan is shown.
                            const tier = difficultyTier(item.value);
                            return (
                              <div
                                key={item.exerciseId}
                                className={`rounded-lg border p-3 border-l-[3px] ${
                                  item.completed
                                    ? "border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10"
                                    : "border-gray-200 dark:border-white/[0.05]"
                                }`}
                                style={{ borderLeftColor: TIER_BADGE_COLOR[tier] === "error" ? "#f04438" : TIER_BADGE_COLOR[tier] === "warning" ? "#f79009" : "#12b76a" }}
                              >
                                {item.startTime && item.endTime && (
                                  <div className="text-xs font-semibold text-brand-500 mb-1">
                                    {formatTime(item.startTime)}&ndash;{formatTime(item.endTime)}
                                  </div>
                                )}
                                <div className={`text-sm font-medium ${item.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-white/90"}`}>
                                  {item.name}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.durationMinutes} min</span>
                                  <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>Lv{item.value}</Badge>
                                </div>
                                {item.sets != null && item.rpe != null && (
                                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    {item.sets} sets &middot; RPE {item.rpe}
                                  </div>
                                )}
                                {item.equipmentName && (
                                  <div className="mt-1 text-[11px] text-brand-500">{item.equipmentName}</div>
                                )}
                                {item.substituted && (
                                  <div className="mt-1 text-[11px] text-gray-400 italic">
                                    substituted for {item.originalName}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pipeline: BFS filters candidates to equipment that actually exists &rarr; Kahn's
                  topological sort fixes each muscle group's easy-to-hard order &rarr; a multi-choice
                  knapsack picks the best combination per day, respecting that order across the whole
                  week &rarr; a sweep over real equipment bookings gives each exercise an actual start
                  and end time (or flags it if nothing was free that day).
                </div>
              </ComponentCard>
            )}
          </>
        )}
      </div>
    </>
  );
}