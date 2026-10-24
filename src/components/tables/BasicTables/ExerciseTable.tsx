import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import fitness_training_schedules_json from "../../../../src/fitness_training_schedules_json.json";
import { useWorkout } from "../../../context/WorkoutContext";
interface ExerciseTableData {
  Day: string;
  Exercise: string;
  Sets: number | string;
  Reps: string;
  status: string;
}

export default function ExerciseTable() {
const navigate = useNavigate();
const [exercise, setexercise] = useState<ExerciseTableData[]>([]);
const { formData, setFormData, startWorkout } = useWorkout();
  const type = formData.goal_diet
useEffect(() => {

  const selectedSchedule =
    fitness_training_schedules_json[
      type as keyof typeof fitness_training_schedules_json
    ];

  const formattedExercises: ExerciseTableData[] = [];

  Object.entries(selectedSchedule.schedule).forEach(
    ([day, dayData]: any) => {

      dayData.exercises.forEach((exercise: any) => {

        formattedExercises.push({
          Day: day,
          Exercise: exercise.name,
          Sets: exercise.sets,
          Reps: exercise.reps,
          status: "In progress"
        });
      });
    }
  );

  setexercise(formattedExercises);

}, [type]);
  return (

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">

      <div className="max-w-full overflow-x-auto">

        <Table>

          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">

            <TableRow>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Day
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Exercise
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Sets
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Reps
              </TableCell>

            </TableRow>

          </TableHeader>

          {/* Body */}
          <TableBody>

            {exercise.map((item, index) => (

              <TableRow key={index}>

                <TableCell className="px-5 py-4 text-center">
                  {item.Day}
                </TableCell>

                <TableCell className="px-5 py-4 text-center">
                  {item.Exercise}
                </TableCell>

                <TableCell className="px-5 py-4 text-center">
                  {item.Sets}
                </TableCell>

                <TableCell className="px-5 py-4 text-center">
                  {item.Reps}
                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>
               <Table>

          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">

            <TableRow>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Do you want to have an schedual of diet for your body?
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-center"
              >
                Do you want to start you training schedual?
              </TableCell>
            </TableRow>

          </TableHeader>

          {/* Body */}
          <TableBody>
              <TableRow >
                <TableCell className="px-5 py-4 text-center">
                  <button 
                  onClick={()=>{
                    navigate("/adddiet")
                  }}
                  type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
                     Generate the diet for your body
                   </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-center">
                                   <button 
                  onClick={()=>{
                    setFormData(prev => ({
                  ...prev,
                  gym_Scheduale:exercise
                  }));
                    setFormData(prev => ({ ...prev, consume_gym_scheduale: true }));
                    navigate("/addworkouts")
                  }}
                  type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
                     Start the scheduale
                   </button>
                </TableCell>
              </TableRow>
          </TableBody>
        </Table>
     
      </div>
    </div>

  );
}
