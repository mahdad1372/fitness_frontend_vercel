import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ExerciseTable from "../../components/tables/BasicTables/ExerciseTable";
import { useWorkout } from "../../context/WorkoutContext";
export default function FormTrainingGym() {
  const { formData, setFormData, startWorkout } = useWorkout();
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | Fitness - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle={formData.goal_diet} />
      <div className="space-y-6">
        <ComponentCard title={formData.goal_diet}>
          <ExerciseTable />
        </ComponentCard>

      </div>

    </>
  );
}
