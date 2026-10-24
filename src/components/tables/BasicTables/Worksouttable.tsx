import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Badge from "../../ui/badge/Badge";
import { useWorkout } from "../../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";



export default function Worksouttable() {
 const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
   const { formData, setFormData, startWorkout } = useWorkout();
  const fetchUsers = async () => {
    try {
      const token = Cookies.get("token"); // 👈 token from cookie
      const userRole = Cookies.get("userrole"); // 👈 role from cookie
      const userId = Cookies.get("userId"); // 👈 userId from cookie

      if (!token) {
        throw new Error("No token found");
      }

      let url = "";
      if (userRole === "Admin") {
        url = "https://fitness-backend-15563671567.europe-west8.run.app/worksout/all";
      } else {
        url = `https://fitness-backend-15563671567.europe-west8.run.app/worksout/${userId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workouts");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number) => {
    const token = Cookies.get("token");

    if (!token) {
      alert("Unauthorized");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workout?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://fitness-backend-15563671567.europe-west8.run.app/worksout/deleteactivity/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete workout");
      }

      // Remove user from UI immediately
      setUsers((prev) => prev.filter((user) => user.id !== id));
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user");
    }
  };

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
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                workouts id 
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User id 
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                type
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                duration
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                calories burned
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                time
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                rest_seconds
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                rpe
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                intensity_percent
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {users.map((order) => (
              
              <TableRow >
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {order.workout_id}
                </TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.user_id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.type}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order.duration}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.calories_burned}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.createdAt} 
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.rest_seconds} 
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                     {order.rpe} 
              </TableCell>
                 <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.intensity_percent} 
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
              
                <button
                onClick={() => handleDeleteUser(order.workout_id)}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                >
                Delete
                </button>
                <button
                 onClick={() => 
                  {
                    setFormData(prev => ({ ...prev, editworkout: true, workout_id:order.workout_id }))
                navigate("/form-elements")}}
                className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 transition ml-3"
                >
                Edit
                </button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
