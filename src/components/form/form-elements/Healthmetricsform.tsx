import { useState,useEffect } from "react";
import ComponentCard from "../../common/ComponentCard.tsx";
import Label from "../Label.tsx";
import Input from "../input/InputField.tsx";
import Select from "../Select.tsx";
import { EyeCloseIcon, EyeIcon, TimeIcon } from "../../../icons/index.ts";
import DatePicker from "../date-picker.tsx";
import { useWorkout } from "../../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
export default function Healthmetricsform() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
const { formData, setFormData, startWorkout } = useWorkout();
  const [formData2, setFormData2] = useState({
    user_id: 0,
    cholesterol: 0,
    body_temperature: 0,
    spo2: 0,
  });
useEffect(() => {
  if (formData.edithealthmetric === true) {
    console.log("hello")
fetch(`http://localhost:7000/health_metric/findbyhealth_id/${formData.health_id}`)
  .then((response) => response.json())
  .then((data) => {
 

    const health = data[0];

    setFormData2((prev) => ({
      ...prev,
      user_id: health.user_id,
    cholesterol: health.cholesterol,
    body_temperature: health.body_temperature,
    spo2: health.spo2,
    }));
  });
  }

  setLoading(false);
}, []);
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
if(formData.edithealthmetric === true){
   
   await fetch(`http://localhost:7000/health_metric/update_healthmetric/${formData.health_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData2),
      });
    setFormData(prev => ({ ...prev, edithealthmetric: false, }))
    navigate("/health-tables")
}else{
    try {
      const response = await fetch("http://localhost:7000/health_metric/addmetrics", {
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
         cholesterol: 0,
        body_temperature: 0,
        spo2: 0,
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

  return (
    <ComponentCard title="Health metrics">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="cholesterol">Cholesterol</Label>
          <Input
           type="number"
          name="cholesterol"
          value={formData2.cholesterol}
          onChange={handleChange}
          placeholder="e.g. 200"
          />
          
          </div>

          <div>
            <Label htmlFor="body_temperature">body_temperature</Label>
            <Input
              type="number"
              name="body_temperature"
              value={formData2.body_temperature}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="spo2">spo2</Label>
            <Input
              type="number"
              name="spo2"
              value={formData2.spo2}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {formData.edithealthmetric === true ? "Edit Health metrics":"Save Health metrics"}
            
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}