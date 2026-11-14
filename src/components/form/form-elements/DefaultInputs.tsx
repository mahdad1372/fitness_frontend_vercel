import { useState, useEffect } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Cookies from "js-cookie";
import { useWorkout } from "../../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
export default function DefaultInputs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const { formData, setFormData, startWorkout } = useWorkout();
  const [formData2, setFormData2] = useState({
    user_id: 0,
    type: "",
    duration: 0,
    calories_burned: 0,
    rest_seconds: 0,
    rpe: 0,
    intensity_percent: 0,
  });

  // Get userId from cookie
  useEffect(() => {
    const id = Cookies.get("userId");
    if (id) {
      setUserId(Number(id));
    }
    setLoading(false);
  }, []);

  // Sync user_id into formData
  useEffect(() => {
    if (userId !== null) {
      setFormData2(prev => ({
        ...prev,
        user_id: userId,
      }));
    }
  }, [userId]);
useEffect(() => {
  const fetchWorkout = async () => {
    try {
      const token = Cookies.get("token");

      if (formData.editworkout === true) {
        const response = await fetch(
          `http://localhost:7000/worksout/getworkouts/${formData.workout_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch workouts");
        }

        const data = await response.json();

        const workout = data[0];
        console.log(workout);

        setFormData2((prev) => ({
          ...prev,
          user_id: workout.user_id || 0,
          type: workout.type || "",
          duration: workout.duration || 0,
          calories_burned: workout.calories_burned || 0,
          rest_seconds: workout.rest_seconds || 0,
          rpe: workout.rpe || 0,
          intensity_percent: workout.intensity_percent || 0,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchWorkout();
}, [formData.editworkout, formData.workout_id]);
  // Unified change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData2(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("token");
if(formData.editworkout === true){
   await fetch(`http://localhost:7000/worksout/updateworkout/${formData.workout_id}`, {
        method: "PUT",
           headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
        body: JSON.stringify(formData2),
      });
    setFormData(prev => ({ ...prev, editworkout: false, }))
    navigate("/workouts-tables")
}else {
    try {
      const response = await fetch("http://localhost:7000/worksout/addworksout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData2),
      });

      if (response.ok) {
        alert("Workout added successfully!");
        setFormData2(prev => ({
          ...prev,
          type: "",
          duration: 0,
          calories_burned: 0,
          rest_seconds: 0,
          rpe: 0,
          intensity_percent: 0,
        }));
      } else {
        alert("Error adding workout.");
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
}

  };

  if (loading) return null;
  console.log(formData.editworkout)
  return (
    <ComponentCard title="Workouts">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="type">Workout Type</Label>
            <Input
              type="text"
              name="type"
              value={formData2.type}
              onChange={handleChange}
              placeholder="e.g. Cardio"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (mins)</Label>
            <Input
              type="number"
              name="duration"
              value={formData2.duration}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="calories_burned">Calories Burned</Label>
            <Input
              type="number"
              name="calories_burned"
              value={formData2.calories_burned}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="rest_seconds">Rest (seconds)</Label>
            <Input
              type="number"
              name="rest_seconds"
              value={formData2.rest_seconds}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="rpe">RPE </Label>
            <Input
              type="number"
              name="rpe"
              value={formData2.rpe}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="intensity_percent">Intensity (%)</Label>
            <Input
              type="number"
              name="intensity_percent"
              value={formData2.intensity_percent}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {formData.editworkout === true ? "Edit Workout":"Save Workout"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}