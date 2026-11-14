import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useWorkout } from "../../context/WorkoutContext";

interface CartItem {
  cart_item: string;
  price: number;
  coach_id: number | null;
  user_id: number;
  cartId: number;
}

interface Student {
  cartId: number;
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
}

export default function MyStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setFormData } = useWorkout();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = Cookies.get("token");
        const coachId = Cookies.get("userId");

        if (!token || !coachId) {
          throw new Error("Unauthorized");
        }

        // 1) All cart items in the system — the only rows that matter here are
        // "PRIVATE COACH" purchases, since those are the only ones that carry a coach_id.
        const cartRes = await fetch("http://localhost:7000/cart/all", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!cartRes.ok) {
          throw new Error("Failed to fetch students");
        }

        const cartItems: CartItem[] = await cartRes.json();

        // 2) Keep only this coach's "PRIVATE COACH" purchases.
        const myClients = cartItems.filter(
          (item) =>
            item.cart_item === "PRIVATE COACH" &&
            item.coach_id === Number(coachId)
        );

        // A student could theoretically show up twice (repeat purchase) — dedupe by user_id,
        // keeping the first cart row seen for that user.
        const seen = new Set<number>();
        const uniqueClients = myClients.filter((item) => {
          if (seen.has(item.user_id)) return false;
          seen.add(item.user_id);
          return true;
        });

        // 3) Look up each student's profile in parallel.
        const studentResults = await Promise.all(
          uniqueClients.map(async (item) => {
            const userRes = await fetch(
              `http://localhost:7000/users/${item.user_id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!userRes.ok) {
              return null;
            }

            const userData = await userRes.json();
            // /users/{id} returns a list, matching the rest of this codebase's convention.
            const user = Array.isArray(userData) ? userData[0] : userData;
            if (!user) {
              return null;
            }

            return {
              cartId: item.cartId,
              user_id: user.user_id,
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
            } as Student;
          })
        );

        setStudents(studentResults.filter((s): s is Student => s !== null));
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Could not load your students.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const openChat = (studentId: number) => {
    setFormData((prev) => ({ ...prev, chatroomnumber: studentId }));
    navigate("/chatbox");
  };

  return (
    <>
      <PageMeta
        title="My Students | Fitness - React.js Admin Dashboard Template"
        description="List of students assigned to this coach"
      />
      <div className="space-y-6">
        <ComponentCard title="My Students">
          {loading ? (
            <div className="p-5">Loading...</div>
          ) : error ? (
            <div className="p-5 text-red-500">{error}</div>
          ) : students.length === 0 ? (
            <div className="p-5 text-gray-500 dark:text-gray-400">
              You don't have any students assigned yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Student ID
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        First name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Last name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Email
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {students.map((student) => (
                      <TableRow key={student.cartId}>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {student.user_id}
                        </TableCell>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {student.firstname}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {student.lastname}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {student.email}
                        </TableCell>
                      </TableRow>
                    ))}
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
