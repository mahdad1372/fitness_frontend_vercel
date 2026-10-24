import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { fetchAllExercises, fetchSubstitutes } from "../../api/exerciseGraphApi";
import { Exercise, difficultyTier, TIER_BADGE_COLOR } from "../../types/exerciseGraph";

export default function FindSubstitute() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [unavailableEquipment, setUnavailableEquipment] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<Exercise[] | null>(null);

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

  const equipmentOptions = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.equipment_required) set.add(ex.equipment_required);
    });
    return Array.from(set).sort();
  }, [exercises]);

  const selectedExercise = useMemo(
    () => exercises.find((ex) => String(ex.exercise_id) === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId]
  );

  const toggleEquipment = (equipment: string, checked: boolean) => {
    setUnavailableEquipment((prev) => {
      const next = new Set(prev);
      if (checked) next.add(equipment);
      else next.delete(equipment);
      return next;
    });
  };

  const handleSearch = async () => {
    if (!selectedExerciseId) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const data = await fetchSubstitutes(
        Number(selectedExerciseId),
        Array.from(unavailableEquipment),
        5
      );
      setResults(data);
    } catch (err) {
      console.error("Error fetching substitutes:", err);
      setSearchError("Failed to search for substitutes.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Find Substitute | Fitness - Admin Dashboard Template"
        description="Find a substitute exercise reachable in the exercise graph"
      />
      <PageBreadcrumb pageTitle="Find Substitute" />
      <div className="space-y-6">
        <ComponentCard
          title="Find a substitute exercise"
          desc="Pick the exercise you can't do, tell us what equipment isn't available, and we'll walk the substitution graph to find the closest replacements."
        >
          {loading ? (
            <div className="p-5">Loading...</div>
          ) : loadError ? (
            <div className="p-5 text-error-500">{loadError}</div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label htmlFor="exercise-select">Your exercise</Label>
                <Select
                  options={exercises.map((ex) => ({
                    value: String(ex.exercise_id),
                    label: `${ex.name} (${ex.muscle_group})`,
                  }))}
                  placeholder="Select the exercise you want to replace"
                  onChange={(value) => {
                    setSelectedExerciseId(value);
                    setResults(null);
                    setSearchError(null);
                  }}
                  defaultValue={selectedExerciseId}
                />
              </div>

              {equipmentOptions.length > 0 && (
                <div>
                  <Label>Equipment not available to you</Label>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/[0.05]">
                    {equipmentOptions.map((equipment) => (
                      <Checkbox
                        key={equipment}
                        id={`equipment-${equipment}`}
                        label={equipment}
                        checked={unavailableEquipment.has(equipment)}
                        onChange={(checked) => toggleEquipment(equipment, checked)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={!selectedExerciseId || searching}
              >
                {searching ? "Searching..." : "Search substitutes"}
              </Button>

              {searchError && <div className="text-error-500">{searchError}</div>}

              {selectedExercise && results !== null && (
                <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-white/[0.05]">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Excluded:
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {selectedExercise.name}
                    </span>
                    <Badge
                      size="sm"
                      color={TIER_BADGE_COLOR[difficultyTier(selectedExercise.difficulty_level)]}
                    >
                      Lv{selectedExercise.difficulty_level}
                    </Badge>
                    {selectedExercise.equipment_required && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        needs {selectedExercise.equipment_required}
                      </span>
                    )}
                  </div>

                  {results.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 p-5 text-center text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
                      No reachable substitutes found with the equipment you have available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.map((sub) => {
                        const tier = difficultyTier(sub.difficulty_level);
                        return (
                          <div
                            key={sub.exercise_id}
                            className="rounded-xl border border-gray-200 p-4 dark:border-white/[0.05]"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium text-gray-800 dark:text-white/90">
                                {sub.name}
                              </span>
                              <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>
                                Lv{sub.difficulty_level}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {sub.muscle_group}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {sub.equipment_required ?? "Bodyweight"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}