import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
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
  PlannedFood,
  scaleMacro,
} from "../../types/mealPlanner";

const DEFAULT_GRAMS = 100;
const MAX_GRAMS = 5000;

// Explains, in plain language, why the optimizer left one candidate food
// out of the plan: which target(s) would be pushed over if it were added
// on top of what was already selected.
function exclusionReason(food: PlannedFood, plan: MealPlanResponse): string {
  const dims: { name: string; combined: number; target: number; unit: string }[] = [
    { name: "calories", combined: plan.achievedCalories + food.calories, target: plan.targetCalories, unit: " kcal" },
    { name: "protein", combined: plan.achievedProtein + food.protein, target: plan.targetProtein, unit: "g" },
    { name: "carbs", combined: plan.achievedCarbs + food.carbs, target: plan.targetCarbs, unit: "g" },
    { name: "fat", combined: plan.achievedFat + food.fat, target: plan.targetFat, unit: "g" },
  ];
  const over = dims
    .filter((d) => d.combined > d.target)
    .sort((a, b) => (b.combined - b.target) - (a.combined - a.target));

  if (over.length === 0) {
    return "this could have fit on its own, but a different combination of foods matched all four targets more closely overall.";
  }
  const parts = over.map(
    (d) => `${d.name} over consumed (${Math.round(d.combined)}${d.unit} vs your ${Math.round(d.target)}${d.unit} target)`
  );
  return `adding it would make ${parts.join(" and ")}.`;
}

// The grams box holds raw text so the user can clear it mid-edit; this is
// the number it represents, or null if it isn't a usable portion size.
function parseGrams(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 && n <= MAX_GRAMS ? n : null;
}

// One decimal place, dropping a trailing ".0" (53g of a 3.6g/100g food
// shows "1.9", 100g of it shows "3.6", 200g shows "7.2").
function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

// Meter: fill carries severity (good/off/far off), the unfilled track is a
// lighter step of the SAME hue rather than plain grey, and status is never
// color-alone - a text badge always accompanies it.
function severityOf(achieved: number, target: number): "good" | "warn" | "bad" | "over" {
  if (target <= 0) return "bad";
  const ratio = achieved / target;
  if (ratio >= 0.9 && ratio <= 1.1) return "good";
  // Far UNDER and far OVER get their own distinct label/color - "bad" (Far
  // off) means far under from here on; far over is its own "over" state.
  if (ratio > 1.25) return "over";
  if (ratio >= 0.75 && ratio <= 1.25) return "warn";
  return "bad";
}

const SEVERITY_STYLE: Record<string, { fill: string; track: string; text: string; label: string }> = {
  good: { fill: "#12b76a", track: "#d1fadf", text: "#067647", label: "On target" },
  warn: { fill: "#f79009", track: "#fef0c7", text: "#b54708", label: "Off target" },
  bad: { fill: "#f04438", track: "#fee4e2", text: "#b42318", label: "Far off" },
  over: { fill: "#9b2c6f", track: "#fbe5f3", text: "#7a1d57", label: "Over consumed" },
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
  // Raw text of each food's grams box, keyed by food_id. A food with no
  // entry is at DEFAULT_GRAMS.
  const [gramsText, setGramsText] = useState<Record<number, string>>({});

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
        // User.height is stored (and shown everywhere else, e.g. the
        // Profile page) in METERS, not centimeters despite this field's
        // name - convert here so both the macro-target math below and the
        // on-screen "cm" figure are actually in centimeters.
        setHeightCm(Math.round(user.height * 100));
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

  const toggleFood = (foodId: number, checked: boolean) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  };

  const gramsTextOf = (foodId: number) => gramsText[foodId] ?? String(DEFAULT_GRAMS);

  const setFoodGrams = (foodId: number, text: string) => {
    setGramsText((prev) => ({ ...prev, [foodId]: text }));
  };

  const candidateCount = foods.length;
  const checkedFoods = foods.filter((f) => !excludedIds.has(f.food_id));
  // Only checked foods are sent, so only their grams need to be valid.
  const hasInvalidGrams = checkedFoods.some((f) => parseGrams(gramsTextOf(f.food_id)) === null);

  // Plain sum of every checked food at its entered portion, ignoring the
  // four-ceiling optimizer entirely - this is "what if I just ate
  // everything I've checked", so it's clear right away when that would
  // blow past today's targets, independent of what "Optimize My Day"
  // would actually pick.
  const checkedTotals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const f of checkedFoods) {
      const grams = parseGrams(gramsTextOf(f.food_id));
      if (grams === null) continue;
      calories += scaleMacro(f.calories, grams);
      protein += scaleMacro(f.protein, grams);
      carbs += scaleMacro(f.carbohydrates, grams);
      fat += scaleMacro(f.fats, grams);
    }
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return { calories: Math.round(calories), protein: round1(protein), carbs: round1(carbs), fat: round1(fat) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFoods, gramsText]);

  // Plain sum across every food the optimizer left out, so it's obvious
  // at a glance how much total nutrition is sitting in "Not included".
  const excludedTotals = useMemo(() => {
    if (!plan) return null;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const totals = plan.excludedFoods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      calories: Math.round(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fat: round1(totals.fat),
    };
  }, [plan]);

  const handleOptimize = async () => {
    setGenerating(true);
    setGenerateError(null);
    setPlan(null);
    try {
      const userId = Number(Cookies.get("userId"));
      // Checked foods with their portion sizes; the backend scales each
      // food's per-100g macros by grams / 100 before optimizing.
      // canOptimize guarantees every grams value here parses.
      const portions = checkedFoods.map((f) => ({
        foodId: f.food_id,
        grams: parseGrams(gramsTextOf(f.food_id)) ?? DEFAULT_GRAMS,
      }));
      const request = targetsManuallyEdited && targets
        ? {
            userId,
            manualCalories: targets.calories,
            manualProtein: targets.protein,
            manualCarbs: targets.carbs,
            manualFat: targets.fat,
            foods: portions,
          }
        : {
            userId,
            age,
            gender,
            weightKg,
            heightCm,
            goal,
            activityLevel,
            foods: portions,
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

  const canOptimize = checkedFoods.length > 0 && !hasInvalidGrams && !generating;

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
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{age}</div>
                </div>
                <div>
                  <Label>Gender</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90 capitalize">{gender}</div>
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{weightKg} kg</div>
                </div>
                <div>
                  <Label>Height (m)</Label>
                  {/* heightCm itself stays real centimeters (see the load
                      effect above) since that's what the macro-target
                      formula needs - only this on-screen label is shown
                      back in meters, same unit the Profile page uses. */}
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{(heightCm / 100).toFixed(1)} m</div>
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
              desc="Calculated from your profile and goal above (Mifflin-St Jeor BMR \u2192 TDEE \u2192 macro split)."
            >
              <div className="flex gap-4 flex-wrap">
                <div className="w-[150px]">
                  <Label>Calories</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{targets?.calories ?? "-"}</div>
                </div>
                <div className="w-[150px]">
                  <Label>Protein (g)</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{targets?.protein ?? "-"}</div>
                </div>
                <div className="w-[150px]">
                  <Label>Carbs (g)</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{targets?.carbs ?? "-"}</div>
                </div>
                <div className="w-[150px]">
                  <Label>Fat (g)</Label>
                  <div className="text-base font-semibold text-gray-800 dark:text-white/90">{targets?.fat ?? "-"}</div>
                </div>
              </div>
              {!targets && (
                <div className="mt-3 text-xs text-gray-400 italic">
                  Click "Calculate Targets" above to see your numbers.
                </div>
              )}
            </ComponentCard>

            <ComponentCard
              title="Candidate foods"
              desc="All checked in by default - the optimizer picks which combination to actually use. Set each food's portion in grams; its macros scale from the per-100g values."
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {candidateCount} foods from your log available today
                </span>
              </div>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                {foods.map((f) => {
                  const text = gramsTextOf(f.food_id);
                  const grams = parseGrams(text);
                  const checked = !excludedIds.has(f.food_id);
                  const invalid = grams === null;
                  // While the box is invalid, show "-" rather than guessing.
                  const show = (per100g: number) => (grams === null ? "-" : fmt(scaleMacro(per100g, grams)));
                  // The optimizer treats all four daily targets as ceilings it can
                  // never cross (see MealPlanner.java). If THIS PORTION ALONE already
                  // exceeds one of them, no combination can ever include it, no matter
                  // what else is checked - flag that here instead of only finding out
                  // after clicking "Optimize My Day".
                  const overTarget: string[] = [];
                  if (checked && grams !== null && targets) {
                    const flagIfOver = (per100g: number, target: number, unit: string, label: string) => {
                      const amount = scaleMacro(per100g, grams);
                      if (amount > target) {
                        overTarget.push(`${label} (${fmt(amount)}${unit} vs ${target}${unit} target)`);
                      }
                    };
                    flagIfOver(f.calories, targets.calories, " kcal", "calories");
                    flagIfOver(f.protein, targets.protein, "g", "protein");
                    flagIfOver(f.carbohydrates, targets.carbs, "g", "carbs");
                    flagIfOver(f.fats, targets.fat, "g", "fat");
                  }
                  return (
                    <div key={f.food_id} className="flex flex-col gap-1.5 py-2.5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                      <Checkbox
                        id={`food-${f.food_id}`}
                        label={`${f.food_name} (${f.category})`}
                        checked={checked}
                        onChange={(next) => toggleFood(f.food_id, next)}
                      />
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            min={1}
                            max={MAX_GRAMS}
                            step="any"
                            value={text}
                            disabled={!checked}
                            aria-label={`Grams of ${f.food_name}`}
                            aria-invalid={checked && invalid}
                            onChange={(e) => setFoodGrams(f.food_id, e.target.value)}
                            className={`h-8 w-20 rounded-lg border px-2 text-right text-sm bg-transparent text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 disabled:opacity-40 disabled:cursor-not-allowed ${
                              checked && invalid
                                ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
                                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                            }`}
                          />
                          <span>g</span>
                        </label>
                        <span className="w-16 text-right">{show(f.calories)} kcal</span>
                        <span className="w-12 text-right">{show(f.protein)}g P</span>
                        <span className="w-12 text-right">{show(f.carbohydrates)}g C</span>
                        <span className="w-12 text-right">{show(f.fats)}g F</span>
                      </div>
                    </div>
                    {overTarget.length > 0 && (
                      <div className="text-xs text-warning-500 dark:text-warning-400 pl-1">
                        ⚠ This portion alone already exceeds today's {overTarget.join(", ")} — the optimizer can never select it at this size, no matter what else is checked. Try a smaller portion.
                      </div>
                    )}
                    </div>
                  );
                })}
                {hasInvalidGrams && (
                  <div className="pt-3 text-xs text-error-500">
                    Enter a portion between 1 and {MAX_GRAMS} g for every checked food (or uncheck it).
                  </div>
                )}
                {foods.length === 0 && (
                  <div className="py-4 text-sm text-gray-400 italic">
                    No logged foods yet - add some from the Foods page first.
                  </div>
                )}
              </div>
            </ComponentCard>

            {targets && checkedFoods.length > 0 && (
              <ComponentCard
                title="If you ate everything checked"
                desc="A plain total of every checked food at its entered portion, ignoring the optimizer entirely - so you can see right away whether your current selections would blow past today's targets."
              >
                <div className="flex gap-7 flex-wrap">
                  <Meter label="Calories" unit=" kcal" achieved={checkedTotals.calories} target={targets.calories} />
                  <Meter label="Protein" unit="g" achieved={checkedTotals.protein} target={targets.protein} />
                  <Meter label="Carbs" unit="g" achieved={checkedTotals.carbs} target={targets.carbs} />
                  <Meter label="Fat" unit="g" achieved={checkedTotals.fat} target={targets.fat} />
                </div>
              </ComponentCard>
            )}

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
                                {f.grams != null && (
                                  <span className="ml-1.5 font-normal text-gray-500 dark:text-gray-400">
                                    &middot; {fmt(f.grams)} g
                                  </span>
                                )}
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
                        <div key={f.foodId} className="flex flex-col gap-1 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              <span className="line-through">{f.name}</span>
                              {f.grams != null && <span> &middot; {fmt(f.grams)} g</span>}
                            </span>
                            <span className="text-xs text-gray-400">
                              {f.calories} kcal &middot; {f.protein}g P &middot; {f.carbs}g C &middot; {f.fat}g F
                            </span>
                          </div>
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {f.name}
                            {f.grams != null && ` \u00b7 ${fmt(f.grams)}g`} not included &mdash; {exclusionReason(f, plan)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {excludedTotals && (
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200 dark:border-white/[0.08]">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Total not included ({plan.excludedFoods.length} food{plan.excludedFoods.length === 1 ? "" : "s"})
                        </span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {excludedTotals.calories} kcal &middot; {excludedTotals.protein}g P &middot;{" "}
                          {excludedTotals.carbs}g C &middot; {excludedTotals.fat}g F
                        </span>
                      </div>
                    )}
                  </ComponentCard>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pipeline: candidate foods come from your logged catalog, each scaled from its per-100g values
                  to the portion you entered &rarr; each macro (calories, protein,
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