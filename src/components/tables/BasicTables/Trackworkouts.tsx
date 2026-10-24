import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import PageBreadcrumb from "../../common/PageBreadCrumb";
import Badge from "../../ui/badge/Badge";
import Currentworkout from "../../../components/UserProfile/Currentworkout";
import ComponentCard from "../../common/ComponentCard";
import { useWorkout } from "../../../context/WorkoutContext";
interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

// Define the table data using the interface
const tableData: Order[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Lindsey Curtis",
      role: "Web Designer",
    },
    projectName: "Agency Website",
    team: {
      images: [
        "/images/user/user-22.jpg",
        "/images/user/user-23.jpg",
        "/images/user/user-24.jpg",
      ],
    },
    budget: "3.9K",
    status: "Active",
  },
];

export default function Trackworkouts() {
   const { formData } = useWorkout();
  const exercise_time_duration = [
  { name: "Treadmill Walking" },
  { name: "Jogging" },
  { name: "Plank" },
  { name: "Walking Lunges" },
  { name: "Battle Rope" },
  { name: "Mountain Climbers" },
  { name: "Walking" },
  { name: "Cycling" },
  { name: "Stretching" },
  { name: "Jump Rope" }
];
  return (
    <div>
      {formData.consume_gym_scheduale && (
    <ComponentCard title={formData.day_scheduale +" Planned gym scheduale" } >
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Exercise
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Sets
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Rpe
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
     {formData.gym_Scheduale.filter((x)=> x.Day === formData.day_scheduale).map((x, index) => (
  <TableRow key={index}>
    <TableCell className="px-5 py-4 sm:px-6 text-start">
      {x.Exercise}
    </TableCell>

    <TableCell className="py-4 sm:px-6 text-start">
      {x.Sets}
    </TableCell>

    <TableCell className="py-4 sm:px-6 text-start">
      {x.Reps}
    </TableCell>
        <TableCell className="py-4 sm:px-6 text-start">
     
          <Badge color={x.status === "Done" ? "success" : "warning"}>
            {x.status}
          </Badge>
      
    </TableCell>
  </TableRow>
))}
          </TableBody>
        </Table>
      </div>
    </div>
    </ComponentCard>
      )}

    <ComponentCard title="Planned gym exercise">
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                exercise Type
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Exercise
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                  {exercise_time_duration.some(ex => ex.name === formData.exercises[0])
                  ? "Time Duration"
                  : "RPE"}
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Sets
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Rest seconds
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          <TableRow>
          <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-10 overflow-hidden">
                     {formData.type[0]}
                    </div>
                  </div>
                </TableCell>
            <TableCell className="py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 overflow-hidden">
                     {formData.exercises[0]}
                    </div>
                  </div>
                </TableCell>
              <TableCell className="py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 overflow-hidden">
                     {formData.rpe}{exercise_time_duration.some(ex => ex.name === formData.exercises[0])
                  ? " min"
                  : ""}
                    </div>
                  </div>
                </TableCell>
              <TableCell className="py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 overflow-hidden">
                     {formData.sets}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 overflow-hidden">
                     {formData.rest_seconds}
                    </div>
                  </div>
                </TableCell>
          </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
    </ComponentCard>

           <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
             <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
               Track current exercise
             </h3>
             <div className="space-y-6">
         <Currentworkout  />
             </div>
           </div>
     </div>
  );
}
