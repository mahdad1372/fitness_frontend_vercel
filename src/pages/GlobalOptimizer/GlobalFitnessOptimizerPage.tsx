import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { fetchAllExercises } from "../../api/exerciseGraphApi";
import { generateGlobalOptimizationPlans } from "../../api/globalOptimizerApi";
import { DAYS, DAY_LABELS, Day } from "../../types/weeklyPlanner";
import { GOALS, GOAL_LABELS, ACTIVITY_LEVELS, ACTIVITY_LABELS, Goal, ActivityLevel } from "../../types/mealPlanner";
import { GlobalOptimizationResponse, GlobalPlanOption } from "../../types/globalOptimizer";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Defaults the date picker to next Monday, same convention SmartWeeklyPlanner uses.
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Small stat tile - reused for both the score breakdown and the macro summary.
function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-white/[0.05] p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{value}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function GlobalFitnessOptimizerPage() {
  // Read fresh on every render, not as a module constant - same reasoning
  // SmartWeeklyPlanner documents: a fresh login swaps the cookie without
  // re-running a top-level const.
  const studentId = Number(Cookies.get("userId"));

  const [muscleGroupOptions, setMuscleGroupOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dailyBudgets, setDailyBudgets] = useState<Record<Day, number>>(
    () => Object.fromEntries(DAYS.map((d) => [d, 0])) as Record<Day, number>
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [weekStartDate, setWeekStartDate] = useState<string>(nextMonday());
  const [goal, setGoal] = useState<Goal>("MAINTENANCE");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATELY_ACTIVE");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [response, setResponse] = useState<GlobalOptimizationResponse | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllExercises();
        const groups = Array.from(new Set(data.map((e) => e.muscle_group))).sort();
        setMuscleGroupOptions(groups);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setLoadError("Failed to load the exercise catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    if (!studentId) {
      setGenerateError("You need to be signed in to generate plans.");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    setResponse(null);
    setActiveLabel(null);
    try {
      const result = await generateGlobalOptimizationPlans({
        studentId,
        weekStartDate,
        muscleGroups: Array.from(selectedGroups),
        dailyBudgetMinutes: dailyBudgets,
        goal,
        activityLevel,
      });
      setResponse(result);
      setActiveLabel(result.plans[0]?.label ?? null);
    } catch (err) {
      console.error("Error generating global optimization plans:", err);
      setGenerateError(
        "Failed to generate plans. Make sure at least one muscle group and one training day are selected, and that you have logged some foods to plan meals from."
      );
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = selectedGroups.size > 0 && weeklyBudget > 0 && !generating;
  const activePlan: GlobalPlanOption | null =
    response?.plans.find((p) => p.label === activeLabel) ?? response?.plans[0] ?? null;

  return (
    <>
      <PageMeta
        title="Global Fitness Plan Optimizer | Fitness - Admin Dashboard Template"
        description="Three real trade-off plans - performance, balanced, budget - coordinating the exercise graph, weekly planner and meal planner at once"
      />
      <PageBreadcrumb pageTitle="Global Fitness Plan Optimizer" />
      <div className="space-y-6">
        {loading ? (
          <ComponentCard title="Global Fitness Plan Optimizer">
            <div className="p-5">Loading...</div>
          </ComponentCard>
        ) : loadError ? (
          <ComponentCard title="Global Fitness Plan Optimizer">
            <div className="p-5 text-error-500">{loadError}</div>
          </ComponentCard>
        ) : (
          <>
            <div className="rounded-2xl border border-[#dde9ff] bg-[#ecf3ff] p-5 flex items-center gap-4 flex-wrap dark:border-brand-800 dark:bg-brand-950">
              <p className="text-sm text-brand-600 dark:text-brand-300 max-w-3xl">
                One engine, three trade-offs. It runs a small grid of candidate weekly schedules and
                meal selections through the same Exercise Graph, Weekly Planner and Meal Planner you
                already use, scores each on progress, fatigue, food cost, scheduling convenience and
                preference match, then picks whichever candidate best serves a performance-focused,
                balanced, or budget-focused weighting - the weighted-scalarization approach from the
                multi-objective optimization proposal, scoped to what's realistic to run live.
              </p>
            </div>

            <ComponentCard
              title="Week starting"
              desc="The Monday these plans are for."
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
              desc="Your real training-time ceiling. Each candidate scales this up or down to explore the intensity trade-off - leave a day at 0 for a rest day."
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
              desc="What all three plans should train this week."
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

            <ComponentCard
              title="Goal & activity level"
              desc="Feeds the same Mifflin-St Jeor macro calculation the Smart Meal Planner uses, for the meal half of each plan."
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2 w-[220px]">
                  <Label>Goal</Label>
                  <Select
                    options={GOALS.map((g) => ({ value: g, label: GOAL_LABELS[g] }))}
                    defaultValue={goal}
                    onChange={(v) => setGoal(v as Goal)}
                  />
                </div>
                <div className="flex flex-col gap-2 w-[220px]">
                  <Label>Activity level</Label>
                  <Select
                    options={ACTIVITY_LEVELS.map((a) => ({ value: a, label: ACTIVITY_LABELS[a] }))}
                    defaultValue={activityLevel}
                    onChange={(v) => setActivityLevel(v as ActivityLevel)}
                  />
                </div>
              </div>
            </ComponentCard>

            <div className="flex items-center justify-end">
              <Button onClick={handleGenerate} disabled={!canGenerate}>
                {generating ? "Generating 3 plans..." : "Generate 3 Plans"}
              </Button>
            </div>

            {generateError && <div className="text-error-500">{generateError}</div>}

            {response && activePlan && (
              <>
                <ComponentCard title="Pick a trade-off">
                  <div className="flex flex-wrap gap-2">
                    {response.plans.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setActiveLabel(p.label)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${
                          p.label === activePlan.label
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-white text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </ComponentCard>

                <ComponentCard
                  title={activePlan.label}
                  desc={activePlan.description}
                >
                  <div className="mb-2 text-[11px] text-gray-400 italic">
                    Candidate configuration: {activePlan.candidateConfig}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <StatTile label="Progress" value={activePlan.progressScore.toFixed(0)} hint="total training value" />
                    <StatTile label="Fatigue" value={activePlan.fatigueScore.toFixed(0)} hint="RPE x minutes" />
                    <StatTile label="Food cost" value={activePlan.costScore.toFixed(1)} hint="synthetic cost units" />
                    <StatTile label="Scheduling conflicts" value={String(activePlan.inconvenienceScore)} />
                    <StatTile label="Preference match" value={activePlan.preferenceScore.toFixed(2)} />
                    <StatTile label="Overall score" value={activePlan.overallScore.toFixed(3)} hint="weighted, normalized" />
                  </div>
                </ComponentCard>

                <ComponentCard title="Weekly exercise schedule">
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weekly time budget</div>
                      <div className="text-xl font-semibold text-gray-800 dark:text-white/90">{activePlan.weeklyPlan.weeklyBudgetMinutes} min</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time used</div>
                      <div className="text-xl font-semibold text-gray-800 dark:text-white/90">{activePlan.weeklyPlan.totalMinutesUsed} min</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total training value</div>
                      <div className="text-xl font-semibold text-success-600">{activePlan.weeklyPlan.totalValue}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {DAYS.map((day) => {
                      const items = activePlan.weeklyPlan.planByDay[day] ?? [];
                      const used = items.reduce((sum, i) => sum + i.durationMinutes, 0);
                      return (
                        <div key={day} className="flex-1 min-w-[160px] flex flex-col gap-2">
                          <div className="pb-2 border-b border-gray-200 dark:border-white/[0.05]">
                            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{DAY_LABELS[day]}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{used} min</div>
                          </div>
                          {items.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-xs italic text-gray-400 py-6">
                              Rest day
                            </div>
                          ) : (
                            items.map((item) => (
                              <div
                                key={item.exerciseId}
                                className={`rounded-lg border p-3 ${
                                  item.schedulingNote
                                    ? "border-[#fecaca] bg-[#fef2f2] dark:border-red-900/40 dark:bg-red-950/20"
                                    : "border-gray-200 dark:border-white/[0.05]"
                                }`}
                              >
                                {item.startTime && item.endTime && !item.schedulingNote && (
                                  <div className="text-xs font-semibold text-brand-500 mb-1">
                                    {formatTime(item.startTime)}&ndash;{formatTime(item.endTime)}
                                  </div>
                                )}
                                <div className="text-sm font-medium text-gray-800 dark:text-white/90">{item.name}</div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.durationMinutes} min</span>
                                  <Badge size="sm" color="primary">Lv{item.value}</Badge>
                                </div>
                                {item.schedulingNote && (
                                  <div className="mt-1 text-[11px] text-error-500 leading-relaxed">{item.schedulingNote}</div>
                                )}
                                {item.substituted && (
                                  <div className="mt-1 text-[11px] text-gray-400 italic">
                                    substituted for {item.originalName}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ComponentCard>

                <ComponentCard
                  title="Representative day's meal plan"
                  desc="One optimized day's selection against this plan's macro targets - the Meal Planner itself plans one day at a time, so this isn't 7 unique days."
                >
                  <div className="flex flex-wrap gap-3 mb-4">
                    <StatTile
                      label="Calories"
                      value={`${activePlan.mealPlan.achievedCalories} / ${activePlan.mealPlan.targetCalories}`}
                    />
                    <StatTile
                      label="Protein"
                      value={`${activePlan.mealPlan.achievedProtein}g / ${activePlan.mealPlan.targetProtein}g`}
                    />
                    <StatTile
                      label="Carbs"
                      value={`${activePlan.mealPlan.achievedCarbs}g / ${activePlan.mealPlan.targetCarbs}g`}
                    />
                    <StatTile
                      label="Fat"
                      value={`${activePlan.mealPlan.achievedFat}g / ${activePlan.mealPlan.targetFat}g`}
                    />
                  </div>
                  {activePlan.mealPlan.selectedFoods.length === 0 ? (
                    <div className="text-sm italic text-gray-400">
                      No foods selected - log some foods first so there's something to plan meals from.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activePlan.mealPlan.selectedFoods.map((food) => (
                        <div
                          key={food.foodId}
                          className="rounded-lg border border-gray-200 dark:border-white/[0.05] p-3 min-w-[160px]"
                        >
                          <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {food.name}
                            {food.grams != null && (
                              <span className="font-normal text-gray-400"> &middot; {food.grams} g</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            {food.calories} kcal &middot; {food.protein}g protein
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ComponentCard>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
