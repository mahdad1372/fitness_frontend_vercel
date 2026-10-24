import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Worksouttable from "../../components/tables/BasicTables/Worksouttable";

export default function WorkoutsTables() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | Fitness - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Workouts Tables" />
      <div className="space-y-6">
        <ComponentCard title="Workouts Table">
          <Worksouttable />
        </ComponentCard>
      </div>

    </>
  );
}
