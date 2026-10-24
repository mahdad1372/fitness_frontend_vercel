import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import React, { useEffect, useState, useRef } from "react";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";
import CoachChat from "./Coachchats"
export default function Alerts() {

  return (
    <>
      <PageMeta
        title="React.js Alerts Dashboard | Fitness - React.js Admin Dashboard Template"
        description="This is React.js Alerts Dashboard page for Fitness - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Chats" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Chats">
          sav
       {/* <CoachChat/> */}
          {/* <Studentchats senderLabel="Coach" color="blue" />
          <Studentchats senderLabel="Student" color="green" /> */}
          {/* {userRole === "ADMIN" ? <CoachChat /> : <Studentchats />} */}
        </ComponentCard>
      </div>
    </>
  );
}
