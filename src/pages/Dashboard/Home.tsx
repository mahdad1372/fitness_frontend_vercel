import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import CaloriesChart from "../../components/ecommerce/CaloriesChart";
import MyStudents from "../../components/ecommerce/MyStudents";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Cookies from "js-cookie";

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = Cookies.get("userrole");
    if (role) {
      setUserRole(role);
    }
  }, []);

  const isCoach = userRole === "COACH";

  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | Fitness - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {isCoach ? (
          <>
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <EcommerceMetrics />
                <MyStudents />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-12 space-y-6 xl:col-span-7">
              <EcommerceMetrics />
              <MonthlySalesChart />
              <CaloriesChart />
            </div>
            <div className="col-span-12 xl:col-span-5">
              <MonthlyTarget />
            </div>
          </>
        )}
      </div>
    </>
  );
}