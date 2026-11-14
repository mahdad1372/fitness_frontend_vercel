import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Badge from "../../ui/badge/Badge";
import { useWorkout } from "../../../context/WorkoutContext";
interface Service {
  cart_item: string;
  price:number;
  coach_id:number;
  user_id:number;
  cartId:number;
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setservices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
//   const { formData, setFormData, startWorkout } = useWorkout();

  const fetchService = async () => {
    try {
      const token = Cookies.get("token");
     
      const userId = Cookies.get("userId");

      if (!token) {
        throw new Error("Unauthorized");
      }

      const role = await fetch("http://localhost:7000/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!role.ok) {
        throw new Error("Failed to fetch foods");
      }else{
        const Role = await role.json();
        const url = `http://localhost:7000/cart/findbyuserid/${userId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch foods");
      }
      const data = await response.json();

      setservices(data);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, []);



  if (loading) {
    return <div className="p-5">Loading...</div>;
  }


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Diet Scheduale
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Gym Scheduale
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Private coach
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                AI Health Analysis
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              <TableRow >
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                 {services.find((x)=>x.cart_item === "Diet scheduale") ? 
                    <button
                className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 transition ml-3"
                >
                 ACTIVE
                 </button>
                 : <button
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition ml-3"
                >
                 NOT ACTIVE
                 </button>}
            
                 
                </TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                         {services.find((x)=>x.cart_item === "Gym scheduale") ?
                          <button
                className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 transition ml-3"
                >
                 ACTIVE
                 </button>
                 : <button
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition ml-3"
                >
                 NOT ACTIVE
                 </button>}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {services.find((x)=>x.cart_item === "PRIVATE COACH") ? <button
                className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 transition ml-3"
                >
                 ACTIVE
                 </button>
                 : <button
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition ml-3"
                >
                 NOT ACTIVE
                 </button>}
                </TableCell>
              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {services.find((x)=>x.cart_item === "AI health analysis") ? <button
                className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 transition ml-3"
                >
                 ACTIVE
                 </button>
                 : <button
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition ml-3"
                >
                 NOT ACTIVE
                 </button>}
                </TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
