import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { fetchAllExercises } from "../../api/exerciseGraphApi";
import { Exercise, difficultyTier, TIER_BADGE_COLOR } from "../../types/exerciseGraph";

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllExercises();
        setExercises(data);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setError("Failed to load the exercise library.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <PageMeta
        title="Exercise Library | Fitness - Admin Dashboard Template"
        description="Browse every exercise in the exercise graph catalog"
      />
      <PageBreadcrumb pageTitle="Exercise Library" />
      <div className="space-y-6">
        <ComponentCard
          title="Exercise Library"
          desc="Every exercise in the catalog, with its muscle group, equipment requirement and difficulty tier."
        >
          {loading ? (
            <div className="p-5">Loading...</div>
          ) : error ? (
            <div className="p-5 text-error-500">{error}</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Name
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Muscle group
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Equipment
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Difficulty
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {exercises.map((ex) => {
                      const tier = difficultyTier(ex.difficulty_level);
                      return (
                        <TableRow key={ex.exercise_id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {ex.name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 capitalize">
                            {ex.muscle_group}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 capitalize">
                            {ex.equipment_required ?? "Bodyweight"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <Badge size="sm" color={TIER_BADGE_COLOR[tier]}>
                              Lv{ex.difficulty_level} · {tier}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {exercises.length === 0 && (
                      <TableRow>
                        <TableCell className="px-5 py-6 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                          No exercises in the catalog yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}