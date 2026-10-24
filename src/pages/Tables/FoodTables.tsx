import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import FoodsTabls from "../../components/tables/BasicTables/Foods";

export default function FoodTables() {
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | Fitness - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Food Tables" />
      <div className="space-y-6">
        <ComponentCard title="Food Table">
          <FoodsTabls />
        </ComponentCard>
      </div>

    </>
  );
}
