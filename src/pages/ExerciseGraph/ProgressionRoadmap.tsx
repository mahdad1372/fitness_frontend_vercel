import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  fetchAllExercises,
  fetchProgressionOrder,
  fetchSmoothestPath,
} from "../../api/exerciseGraphApi";
import {
  Exercise,
  PathResult,
  difficultyTier,
  TIER_COLOR,
  TIER_BADGE_COLOR,
} from "../../types/exerciseGraph";

type Tab = "browse" | "path";

export default function ProgressionRoadmap() {
  const [tab, setTab] = useState<Tab>("browse");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllExercises();
        setExercises(data);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setLoadError("Failed to load the exercise list.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const muscleGroupOptions = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => set.add(ex.muscle_group));
    return Array.from(set).sort();
  }, [exercises]);

  return (
    <>
      <PageMeta
        title="Progression Roadmap | Fitness - Admin Dashboard Template"
        description="Browse the difficulty-ordered progression roadmap or find the smoothest path between two exercises"
      />
      <PageBreadcrumb pageTitle="Progression Roadmap" />
      <div className="space-y-6">
        <ComponentCard
          title="Progression roadmap"
          desc="See how exercises for a muscle group build on each other from easiest to hardest, or find the smoothest path from one exercise to a harder goal exercise."
        >
          {loading ? (
            <div className="p-5">Loading...</div>
          ) : loadError ? (
            <div className="p-5 text-error-500">{loadError}</div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-gray-200 dark:border-white/[0.05]">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    tab === "browse"
                      ? "border-b-2 border-brand-500 text-brand-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setTab("browse")}
                >
                  Browse roadmap
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    tab === "path"
                      ? "border-b-2 border-brand-500 text-brand-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setTab("path")}
                >
                  Path to a goal
                </button>
              </div>

              {tab === "browse" ? (
                <BrowseRoadmap muscleGroupOptions={muscleGroupOptions} />
              ) : (
                <PathToGoal exercises={exercises} />
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

function BrowseRoadmap({ muscleGroupOptions }: { muscleGroupOptions: string[] }) {
  const [muscleGroup, setMuscleGroup] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Exercise[] | null>(null);

  const handleBrowse = async (group: string) => {
    setMuscleGroup(group);
    if (!group) {
      setOrder(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProgressionOrder(group);
      setOrder(data);
    } catch (err) {
      console.error("Error fetching progression order:", err);
      setError(
        "Failed to build the roadmap for this muscle group. It may contain a cyclic progression relationship."
      );
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <Label htmlFor="muscle-group-select">Muscle group</Label>
        <Select
          options={muscleGroupOptions.map((g) => ({ value: g, label: g }))}
          placeholder="Select a muscle group"
          onChange={handleBrowse}
          defaultValue={muscleGroup}
        />
      </div>

      {loading && <div>Building roadmap...</div>}
      {error && <div className="text-error-500">{error}</div>}

      {order && !loading && (
        order.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-5 text-center text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
            No exercises found for this muscle group.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {order.map((ex, idx) => {
              const tier = difficultyTier(ex.difficulty_level);
              const sameTierAsPrevious =
                idx > 0 && difficultyTier(order[idx - 1].difficulty_level) === tier;
              return (
                <div key={ex.exercise_id} className="flex items-center gap-2">
                  {idx > 0 && (
                    <span
                      className="text-gray-300 dark:text-gray-600"
                      title={sameTierAsPrevious ? "same difficulty tier" : undefined}
                    >
                      {sameTierAsPrevious ? "≈" : "→"}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-2 rounded-full border px-4 py-2"
                    style={{ borderColor: TIER_COLOR[tier] }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: TIER_COLOR[tier] }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {ex.name}
                    </span>
                    <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>
                      Lv{ex.difficulty_level}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function PathToGoal({ exercises }: { exercises: Exercise[] }) {
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [searched, setSearched] = useState(false);

  const byId = useMemo(() => {
    const map = new Map<number, Exercise>();
    exercises.forEach((ex) => map.set(ex.exercise_id, ex));
    return map;
  }, [exercises]);

  const handleFindPath = async () => {
    if (!fromId || !toId) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      const data = await fetchSmoothestPath(Number(fromId), Number(toId));
      setResult(data);
      setSearched(true);
    } catch (err) {
      console.error("Error fetching smoothest path:", err);
      setError("Failed to search for a path.");
    } finally {
      setLoading(false);
    }
  };

  const exerciseOptions = exercises.map((ex) => ({
    value: String(ex.exercise_id),
    label: `${ex.name} (Lv${ex.difficulty_level})`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="from-select">From (your current level)</Label>
          <Select
            options={exerciseOptions}
            placeholder="Select your starting exercise"
            onChange={setFromId}
            defaultValue={fromId}
          />
        </div>
        <div>
          <Label htmlFor="to-select">To (your goal)</Label>
          <Select
            options={exerciseOptions}
            placeholder="Select your goal exercise"
            onChange={setToId}
            defaultValue={toId}
          />
        </div>
      </div>

      <Button onClick={handleFindPath} disabled={!fromId || !toId || loading}>
        {loading ? "Searching..." : "Find smoothest path"}
      </Button>

      {error && <div className="text-error-500">{error}</div>}

      {searched && !loading && (
        result === null ? (
          <div className="rounded-xl border border-gray-200 p-5 text-center text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
            No progression path connects these two exercises.
          </div>
        ) : (
          <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-white/[0.05]">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total difficulty cost:{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                {result.totalCost}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {result.path.map((id, idx) => {
                const ex = byId.get(id);
                if (!ex) return null;
                const tier = difficultyTier(ex.difficulty_level);
                return (
                  <div key={id} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-gray-300 dark:text-gray-600">→</span>}
                    <div
                      className="flex items-center gap-2 rounded-full border px-4 py-2"
                      style={{ borderColor: TIER_COLOR[tier] }}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: TIER_COLOR[tier] }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {ex.name}
                      </span>
                      <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>
                        Lv{ex.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}