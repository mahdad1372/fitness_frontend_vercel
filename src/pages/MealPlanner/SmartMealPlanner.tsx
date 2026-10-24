import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { fetchCurrentUser, fetchUserFoods, generateMealPlan } from "../../api/mealPlannerApi";
import {
  Goal,
  ActivityLevel,
  GOALS,
  GOAL_LABELS,
  ACTIVITY_LEVELS,
  ACTIVITY_LABELS,
  MacroTargets,
  calculateMacroTargets,
  FoodRow,
  MealPlanResponse,
} from "../../types/mealPlanner";

// Meter: fill carries severity (good/off/far off), the unfilled track is a
// lighter step of the SAME hue rather than plain grey, and status is never
// color-alone - a text badge always accompanies it.
function severityOf(achieved: number, target: number): "good" | "warn" | "bad" {
  if (target <= 0) return "bad";
  const ratio = achieved / target;
  if (ratio >= 0.9 && ratio <= 1.1) return "good";
  if (ratio >= 0.75 && ratio <= 1.25) return "warn";
  return "bad";
}

const SEVERITY_STYLE: Record<string, { fill: string; track: string; text: string; label: string }> = {
  good: { fill: "#12b76a", track: "#d1fadf", text: "#067647", label: "On target" },
  warn: { fill: "#f79009", track: "#fef0c7", text: "#b54708", label: "Off target" },
  bad: { fill: "#f04438", track: "#fee4e2", text: "#b42318", label: "Far off" },
};

function Meter({ label, unit, achieved, target }: { label: string; unit: string; achieved: number; target: number }) {
  const sev = severityOf(achieved, target);
  const style = SEVERITY_STYLE[sev];
  const fillPct = Math.min(target > 0 ? (achieved / target) * 100 : 0, 100);
  return (
    <div className="flex-1 min-w-[180px] flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <span
          className="text-[11px] font-semibold rounded-full px-2.5 py-0.5"
          style={{ color: style.text, backgroundColor: style.track }}
        >
          {style.label}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: style.track }}>
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{ width: `${fillPct}%`, backgroundColor: style.fill }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-white/90">
          {achieved}
          {unit}
        </span>{" "}
        / {target}
        {unit} target
      </div>
    </div>
  );
}

export default function SmartMealPlanner() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("");
  const [weightKg, setWeightKg] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [goal, setGoal] = useState<Goal>("MUSCLE_GAIN");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATELY_ACTIVE");

  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [targetsManuallyEdited, setTargetsManuallyEdited] = useState(false);

  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [user, userFoods] = await Promise.all([
          fetchCurrentUser(),
          fetchUserFoods(Number(Cookies.get("userId"))),
        ]);
        setAge(user.age);
        setGender(user.gender);
        setWeightKg(user.weight);
        setHeightCm(user.height);
        setFoods(userFoods);
      } catch (err) {
        console.error("Error loading meal planner data:", err);
        setLoadError("Failed to load your profile and food log.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCalculateTargets = () => {
    setTargets(calculateMacroTargets(age, gender, weightKg, heightCm, goal, activityLevel));
    setTargetsManuallyEdited(false);
  };

  const updateTarget = (field: keyof MacroTargets, value: number) => {
    setTargets((prev) => ({ ...(prev ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }), [field]: value }));
    setTargetsManuallyEdited(true);
  };

  const toggleFood = (foodId: number, checked: boolean) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  };

  const candidateCount = foods.length;

  const handleOptimize = async () => {
    setGenerating(true);
    setGenerateError(null);
    setPlan(null);
    try {
      const userId = Number(Cookies.get("userId"));
      const request = targetsManuallyEdited && targets
        ? {
            userId,
            manualCalories: targets.calories,
            manualProtein: targets.protein,
            manualCarbs: targets.carbs,
            manualFat: targets.fat,
            excludeFoodIds: Array.from(excludedIds),
          }
        : {
            userId,
            age,
            gender,
            weightKg,
            heightCm,
            goal,
            activityLevel,
            excludeFoodIds: Array.from(excludedIds),
          };
      const result = await generateMealPlan(request);
      setPlan(result);
      // Reflect whatever the backend actually used (its computed targets
      // are authoritative), so the target boxes match the meters below.
      setTargets({
        calories: result.targetCalories,
        protein: result.targetProtein,
        carbs: result.targetCarbs,
        fat: result.targetFat,
      });
    } catch (err) {
      console.error("Error generating meal plan:", err);
      setGenerateError("Failed to generate a plan. Make sure your profile and at least one food are available.");
    } finally {
      setGenerating(false);
    }
  };

  const mealSlots = useMemo(() => {
    if (!plan) return [];
    const slots = new Set(plan.selectedFoods.map((f) => f.mealSlot || "Other"));
    return Array.from(slots);
  }, [plan]);

  const canOptimize = candidateCount - excludedIds.size > 0 && !generating;

  return (
    <>
      <PageMeta
        title="Smart Meal Planner | Fitness - Admin Dashboard Template"
        description="Calculate your daily macro targets and generate an optimized meal plan from your food log"
      />
      <PageBreadcrumb pageTitle="Smart Meal Planner" />
      <div className="space-y-6">
        {loading ? (
          <ComponentCard title="Smart Meal Planner">
            <div className="p-5">Loading...</div>
          </ComponentCard>
        ) : loadError ? (
          <ComponentCard title="Smart Meal Planner">
            <div className="p-5 text-error-500">{loadError}</div>
          </ComponentCard>
        ) : (
          <>
            <ComponentCard
              title="About you today"
              desc="Your profile fills in age, weight and height. Pick today's goal and activity level to calculate targets."
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-white/[0.05]">
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Input type="text" value={gender} onChange={(e) => setGender(e.target.value)} />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-[200px]">
                  <Label>Goal</Label>
                  <Select
                    options={GOALS.map((g) => ({ value: g, label: GOAL_LABELS[g] }))}
                    defaultValue={goal}
                    onChange={(v) => setGoal(v as Goal)}
                  />
                </div>
                <div className="w-[220px]">
                  <Label>Activity level</Label>
                  <Select
                    options={ACTIVITY_LEVELS.map((a) => ({ value: a, label: ACTIVITY_LABELS[a] }))}
                    defaultValue={activityLevel}
                    onChange={(v) => setActivityLevel(v as ActivityLevel)}
                  />
                </div>
                <Button onClick={handleCalculateTargets}>Calculate Targets</Button>
              </div>
            </ComponentCard>

            <ComponentCard
              title="Today's macro targets"
              desc="Calculated from your profile and goal above (Mifflin-St Jeor BMR \u2192 TDEE \u2192 macro split) - adjust any of these before optimizing."
            >
              <div className="flex gap-4 flex-wrap">
                <div className="w-[150px]">
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={targets?.calories ?? ""}
                    onChange={(e) => updateTarget("calories", Number(e.target.value))}
                  />
                </div>
                <div className="w-[150px]">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={targets?.protein ?? ""}
                    onChange={(e) => updateTarget("protein", Number(e.target.value))}
                  />
                </div>
                <div className="w-[150px]">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={targets?.carbs ?? ""}
                    onChange={(e) => updateTarget("carbs", Number(e.target.value))}
                  />
                </div>
                <div className="w-[150px]">
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    value={targets?.fat ?? ""}
                    onChange={(e) => updateTarget("fat", Number(e.target.value))}
                  />
                </div>
              </div>
              {!targets && (
                <div className="mt-3 text-xs text-gray-400 italic">
                  Click "Calculate Targets" above, or type numbers in directly.
                </div>
              )}
            </ComponentCard>

            <ComponentCard title="Candidate foods" desc="All checked in by default - the optimizer picks which combination to actually use.">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {candidateCount} foods from your log available today
                </span>
              </div>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                {foods.map((f) => (
                  <div key={f.food_id} className="flex items-center justify-between py-2.5">
                    <Checkbox
                      id={`food-${f.food_id}`}
                      label={`${f.food_name} (${f.category})`}
                      checked={!excludedIds.has(f.food_id)}
                      onChange={(checked) => toggleFood(f.food_id, checked)}
                    />
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-16 text-right">{f.calories} kcal</span>
                      <span className="w-12 text-right">{f.protein}g P</span>
                      <span className="w-12 text-right">{f.carbohydrates}g C</span>
                      <span className="w-12 text-right">{f.fats}g F</span>
                    </div>
                  </div>
                ))}
                {foods.length === 0 && (
                  <div className="py-4 text-sm text-gray-400 italic">
                    No logged foods yet - add some from the Foods page first.
                  </div>
                )}
              </div>
            </ComponentCard>

            <div className="rounded-2xl border border-[#dde9ff] bg-[#ecf3ff] p-5 flex items-center justify-between gap-4 flex-wrap dark:border-brand-800 dark:bg-brand-950">
              <p className="text-sm text-brand-600 dark:text-brand-300 max-w-3xl">
                This isn't a single-budget knapsack like the Weekly Planner - four targets (calories, protein,
                carbs, fat) have to be satisfied at once, so it's solved as a multi-dimensional knapsack DP, with
                each macro discretized into buckets to keep the state space computable.
              </p>
              <Button onClick={handleOptimize} disabled={!canOptimize}>
                {generating ? "Optimizing..." : "Optimize My Day"}
              </Button>
            </div>

            {generateError && <div className="text-error-500">{generateError}</div>}

            {plan && (
              <>
                <ComponentCard title="Today vs. target">
                  <div className="flex gap-7 flex-wrap">
                    <Meter label="Calories" unit=" kcal" achieved={plan.achievedCalories} target={plan.targetCalories} />
                    <Meter label="Protein" unit="g" achieved={plan.achievedProtein} target={plan.targetProtein} />
                    <Meter label="Carbs" unit="g" achieved={plan.achievedCarbs} target={plan.targetCarbs} />
                    <Meter label="Fat" unit="g" achieved={plan.achievedFat} target={plan.targetFat} />
                  </div>
                </ComponentCard>

                <ComponentCard
                  title="Your optimized plan"
                  desc={`${plan.selectedFoods.length} of ${plan.selectedFoods.length + plan.excludedFoods.length} candidate foods selected - the combination that best fits all four targets at once.`}
                >
                  <div className="flex gap-5 flex-wrap">
                    {mealSlots.map((slot) => (
                      <div key={slot} className="flex-1 min-w-[220px] flex flex-col gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{slot}</div>
                        {plan.selectedFoods
                          .filter((f) => (f.mealSlot || "Other") === slot)
                          .map((f) => (
                            <div
                              key={f.foodId}
                              className="rounded-lg border border-gray-200 dark:border-white/[0.05] p-3"
                            >
                              <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                                {f.name}
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{f.calories} kcal</span>
                                <span>{f.protein}g P</span>
                                <span>{f.carbs}g C</span>
                                <span>{f.fat}g F</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                    {plan.selectedFoods.length === 0 && (
                      <div className="text-sm text-gray-400 italic">
                        Nothing fit within today's targets - try relaxing them or logging more variety.
                      </div>
                    )}
                  </div>
                </ComponentCard>

                {plan.excludedFoods.length > 0 && (
                  <ComponentCard title="Not included">
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {plan.excludedFoods.map((f) => (
                        <div key={f.foodId} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-gray-400 line-through">{f.name}</span>
                          <span className="text-xs text-gray-400">
                            {f.calories} kcal &middot; {f.fat}g fat
                          </span>
                        </div>
                      ))}
                    </div>
                  </ComponentCard>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pipeline: candidate foods come from your logged catalog &rarr; each macro (calories, protein,
                  carbs, fat) is discretized into buckets to keep a 4-dimensional state space computable &rarr; a
                  multi-dimensional 0/1 knapsack DP selects the subset of foods whose combined macros best fit all
                  four targets at once, rather than overshooting one to satisfy another.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}