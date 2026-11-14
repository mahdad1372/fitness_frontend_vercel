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
    food_name: "",
    category: "",
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    meal_time: 0,
    notes: "",
  });

  // Get userId from cookie
  useEffect(() => {
    const id = Cookies.get("userId");
    if (id) {
      setUserId(Number(id));
    }
    setLoading(false);
    if(formData.editfood === true){
      
    }
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
 

  if (formData.editfood === true) {
fetch(`http://localhost:7000/foods/${formData.food_id}`)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);

    const food = data[0];

    setFormData2((prev) => ({
      ...prev,
      food_name: food.food_name,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbohydrates: food.carbohydrates,
      fats: food.fats,
      meal_time: food.meal_time,
      notes: food.notes
    }));
  });
  }

  setLoading(false);
}, []);
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
if(formData.editfood === true){
   await fetch(`http://localhost:7000/foods/updatefoods/${formData.food_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData2),
      });
    setFormData(prev => ({ ...prev, editfood: false, }))
    navigate("/food-tables")
}else{
    try {
      const response = await fetch("http://localhost:7000/foods/addfoods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData2),
      });

      if (response.ok) {
        alert("foods added successfully!");
        setFormData2(prev => ({
          ...prev,
            food_name: "",
            category: "",
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fats: 0,
            meal_time: 0,
            notes:""
        }));
      } else {
        alert("Error adding foods.");
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
}

  };

  if (loading) return null;

  return (
    <ComponentCard title="Foods">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="food_name">food name</Label>
            <Input
              type="text"
              name="food_name"
              value={formData2.food_name}
              onChange={handleChange}
              placeholder="food_name"
            />
          </div>

          <div>
            <Label htmlFor="category">category</Label>
            <Input
              type="text"
              name="category"
              value={formData2.category}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="calories">calories</Label>
            <Input
              type="number"
              name="calories"
              value={formData2.calories}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="protein">protein</Label>
            <Input
              type="number"
              name="protein"
              value={formData2.protein}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="carbohydrates">carbohydrates </Label>
            <Input
              type="number"
              name="carbohydrates"
              value={formData2.carbohydrates}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="fats">fats</Label>
            <Input
              type="number"
              name="fats"
              value={formData2.fats}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="meal_time">meal_time</Label>
            <Input
              type="text"
              name="meal_time"
              value={formData2.meal_time}
              onChange={handleChange}
              placeholder="meal_time"
            />
          </div>
        <div>
            <Label htmlFor="notes">notes</Label>
            <Input
              type="text"
              name="notes"
              value={formData2.notes}
              onChange={handleChange}
              placeholder="notes"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {formData.editfood === true ? "Edit food":"save food"}
            {/* Save Foods */}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}