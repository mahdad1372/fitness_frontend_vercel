import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DefaultInputs from "../../components/form/form-elements/DefaultInputs";
import PageMeta from "../../components/common/PageMeta";
import Healthmetrics from "../../components/form/form-elements/Healthmetricsform";
import Foodform from "../../components/form/form-elements/Foodform";
import Goalform from "../../components/form/form-elements/Goalform";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
export default function FormElements() {
  const [userRole, setuserRole] = useState<string | null>(null);
    useEffect(() => {
      const Role = Cookies.get("userrole");
      if(Role){
        setuserRole(Role);
      }
     
    }, []);
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | Fitness - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Fitness Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {userRole != "COACH" ? (
           <div>
           <div className="space-y-6">
          <DefaultInputs />
          <Foodform />
        </div>
        <div className="space-y-6">
          <Healthmetrics />
               <Goalform />
        </div>
          </div>
) :         <div className="space-y-6">
               <Goalform />
        </div>}
      </div>
    </div>
  );
}
