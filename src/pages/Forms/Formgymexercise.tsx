import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Badge from "../../components/ui/badge/Badge";
import Cookies from "js-cookie";
import { useWorkout } from "../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
export default function Formworkouts() {
  const { formData, setFormData, startWorkout } = useWorkout();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();
  const multiOptions = [
    { value: "Chest & Triceps", text: "Chest & Triceps" },
    { value: "Back & Biceps", text: "Back & Biceps" },
    { value: "Legs & Glutes", text: "Legs & Glutes" },
    { value: "Shoulders & Traps", text: "Shoulders & Traps" },
    {value : "Core & Abs",text :"Core & Abs"},
    {value:"Cardio & Conditioning", text:"Cardio & Conditioning"}
  ];
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

  const exercisesOptions = [
  { value: "Bench Press", text: "Bench Press", type: "Chest & Triceps" },
  { value: "Incline Dumbbell Press", text: "Incline Dumbbell Press", type: "Chest & Triceps" },
  { value: "Incline Bench Press", text: "Incline Bench Press", type: "Chest & Triceps" },
  { value: "Chest Fly", text: "Chest Fly", type: "Chest & Triceps" },
  { value: "Chest Dips", text: "Chest Dips", type: "Chest & Triceps" },
  { value: "Push Ups", text: "Push Ups", type: "Chest & Triceps" },
  { value: "Tricep Pushdown", text: "Tricep Pushdown", type: "Chest & Triceps" },
  { value: "Tricep Extension", text: "Tricep Extension", type: "Chest & Triceps" },
  { value: "Pull Ups", text: "Pull Ups", type: "Back & Biceps" },
  { value: "Lat Pulldown", text: "Lat Pulldown", type: "Back & Biceps" },
  { value: "Barbell Row", text: "Barbell Row", type: "Back & Biceps" },
  { value: "Seated Row", text: "Seated Row", type: "Back & Biceps" },
  { value: "Bicep Curl", text: "Bicep Curl", type: "Back & Biceps" },
  { value: "Hammer Curl", text: "Hammer Curl", type: "Back & Biceps" },
  { value: "Squat", text: "Squat", type: "Legs & Glutes" },
  { value: "Barbell Squat", text: "Barbell Squat", type: "Legs & Glutes" },
  { value: "Front Squat", text: "Front Squat", type: "Legs & Glutes" },
  { value: "Leg Press", text: "Leg Press", type: "Legs & Glutes" },
  { value: "Romanian Deadlift", text: "Romanian Deadlift", type: "Legs & Glutes" },
  { value: "Walking Lunges", text: "Walking Lunges", type: "Legs & Glutes" },
  { value: "Calf Raise", text: "Calf Raise", type: "Legs & Glutes" },
  { value: "Jump Squats", text: "Jump Squats", type: "Legs & Glutes" },
  { value: "Shoulder Press", text: "Shoulder Press", type: "Shoulders & Traps" },
  { value: "Overhead Press", text: "Overhead Press", type: "Shoulders & Traps" },
  { value: "Lateral Raise", text: "Lateral Raise", type: "Shoulders & Traps" },
  { value: "Shrugs", text: "Shrugs", type: "Shoulders & Traps" },
  { value: "Plank", text: "Plank", type: "Core & Abs" },
  { value: "Russian Twist", text: "Russian Twist", type: "Core & Abs" },
  { value: "Leg Raise", text: "Leg Raise", type: "Core & Abs" },
  { value: "Mountain Climbers", text: "Mountain Climbers", type: "Core & Abs" },
  { value: "Jogging", text: "Jogging", type: "Cardio & Conditioning" },
  { value: "Walking", text: "Walking", type: "Cardio & Conditioning" },
  { value: "Cycling", text: "Cycling", type: "Cardio & Conditioning" },
  { value: "Treadmill Walking", text: "Treadmill Walking", type: "Cardio & Conditioning" },
  { value: "Jump Rope", text: "Jump Rope", type: "Cardio & Conditioning" },
  { value: "Battle Rope", text: "Battle Rope", type: "Cardio & Conditioning" },
  { value: "Burpees", text: "Burpees", type: "Cardio & Conditioning" },
  { value: "Deadlift", text: "Deadlift", type: "Shoulders & Traps" }
];
    const dayoptions = [
    { value: "saturday", text: "saturday" },
    { value: "sunday", text: "sunday" },
    { value: "monday", text: "monday" },
    { value: "tuesday", text: "tuesday" },
    { value: "wednesday", text: "wednesday" },
    { value: "thursday", text: "thursday" },
    { value: "friday", text: "friday" }
  ];

  useEffect(() => {
    const id = Cookies.get("userId");
    if (id) setUserId(Number(id));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId !== null) {
      setFormData(prev => ({ ...prev, user_id: userId }));
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 Basic validation
    if (formData.type.length === 0) {
      alert("Please select workout type");
      return;
    }

    if (formData.exercises.length === 0) {
      alert("Please select exercises");
      return;
    }

    if (formData.sets <= 0) {
      alert("Sets must be greater than 0");
      return;
    }

    // ✅ Start workout (context)
    startWorkout();

    // 👉 Navigate to tracking page
    navigate("/trackworkouts");
  };

  if (loading) return null;

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
                Day
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
     {formData.gym_Scheduale.map((x, index) => (
  <TableRow key={index}>
     <TableCell className="px-5 py-4 sm:px-6 text-start">
      {x.Day}
    </TableCell>
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

    <ComponentCard title="Gym exercise">
      <form onSubmit={handleSubmit} className="space-y-6">

    
        <div className="relative z-52">
        <MultiSelect
          label="Select Gym exercise category (type)"
          options={multiOptions}
          onChange={(values) =>
            setFormData(prev => ({ ...prev, type: values }))
          }
        />
        </div>
        <div className="relative z-51">
        <MultiSelect
          label="Select exercises"
          options={exercisesOptions.filter((x)=> x.type === formData.type[0])}
          onChange={(values) =>
            setFormData(prev => ({ ...prev, exercises: values }))
          }
        />
        </div>

        {formData.consume_gym_scheduale === true &&(
         <MultiSelect
          label="Select day of the Gym scheduale exercise that you want to train"
          options={dayoptions}
          onChange={(values) =>
            setFormData(prev => ({ ...prev, day_scheduale: values[0] }))
          }
        />
        )}
        {/* Sets + Rest */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Sets</Label>
            <Input
              type="number"
              name="sets"
              value={formData.sets}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Rest (seconds)</Label>
            <Input
              type="number"
              name="rest_seconds"
              value={formData.rest_seconds}
              onChange={handleChange}
            />
          </div>
        </div>

         {exercise_time_duration.some(ex => ex.name === formData.exercises[0]) &&(
        <div>
          <Label>Minutes duration</Label>
          <Input
            type="number"
            name="rpe"
            value={formData.rpe}
            onChange={handleChange}
          />
        </div>
         )}
          {!exercise_time_duration.some(ex => ex.name === formData.exercises[0]) &&(
          <div>
          <Label>RPE</Label>
          <Input
            type="number"
            name="rpe"
            value={formData.rpe}
            onChange={handleChange}
          />
        </div>
         )}
        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Start exercise
        </button>
      </form>
    </ComponentCard>
    </div>
  );
}