import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Cookies from "js-cookie";
import { useWorkout } from "../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

interface DietInfo {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goaldiet: string;
  workoutsperweek: number;
  Activitylevel: string;
  sleephour: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  muscle_size: number;
  deadlift: number;
}

export default function Formdiet() {
  const { formData, setFormData } = useWorkout();
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();

  const [info, setinfo] = useState<DietInfo>({
    age: 0,
    gender: "",
    height: 0,
    weight: 0,
    goaldiet: "",
    workoutsperweek: 0,
    Activitylevel: "",
    sleephour: 0,
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    muscle_size: 0,
    deadlift: 0,
  });

  // Shown inside the results modal instead of silently displaying a nonsensical
  // negative carbohydrate value.
  const [warning, setWarning] = useState<string | null>(null);

  const Genderoptions = [
    { value: "Male", text: "Male" },
    { value: "Female", text: "Female" },
  ];

  const Goal_diet = [
    { value: "FAT_LOSS", text: "Weight Loss / Fat Loss (Reduce body fat)" },
    { value: "MAINTENANCE", text: "Weight Maintenance (Maintain current weight)" },
    { value: "MUSCLE_GAIN", text: "Muscle Gain / Bulking (Increase muscle mass)" },
    { value: "BODY_RECOMPOSITION", text: "Body Recomposition (Lose fat + gain muscle)" },
    { value: "PERFORMANCE_ENHANCEMENT", text: "Performance Enhancement (Improve athletic performance)" },
  ];

  const Activitylevel = [
    { value: "SEDENTARY", text: "SEDENTARY (Little/no exercise)" },
    { value: "LIGHTLY_ACTIVE", text: "LIGHTLY_ACTIVE (Light exercise 1–3 days/week)" },
    { value: "MODERATELY_ACTIVE", text: "MODERATELY_ACTIVE (Moderate exercise 3–5 days/week)" },
    { value: "VERY_ACTIVE", text: "VERY_ACTIVE (Hard exercise 6–7 days/week)" },
    { value: "ATHLETE", text: "ATHLETE (Intense training / physical job)" },
  ];

  const workoutsperweek = [
    { value: "1", text: "1" },
    { value: "2", text: "2" },
    { value: "3", text: "3" },
    { value: "4", text: "4" },
    { value: "5", text: "5" },
    { value: "6", text: "6" },
    { value: "7", text: "7" },
  ];

  useEffect(() => {
    const idStr = Cookies.get("userId");
    const token = Cookies.get("token");

    if (!idStr) {
      console.error("No userId found in cookies");
      setLoading(false);
      return;
    }

    const id = Number(idStr);
    setFormData((prev) => ({ ...prev, user_id: id }));

    const gymGoalToDietGoalMap: Record<string, string> = {
      muscle_gain: "MUSCLE_GAIN",
      fat_loss: "FAT_LOSS",
      recomposition: "BODY_RECOMPOSITION",
      strength: "PERFORMANCE_ENHANCEMENT",
      fitness: "MAINTENANCE",
    };
    if (formData.goal_gym && gymGoalToDietGoalMap[formData.goal_gym]) {
      setinfo((prev) => ({ ...prev, goaldiet: gymGoalToDietGoalMap[formData.goal_gym] }));
    }

    fetch(`http://localhost:7000/users/${idStr}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        const userData = Array.isArray(data) ? data[0] : data;
        if (!userData) {
          console.error("No user data returned for id", idStr);
          return;
        }
        // Number(...) so a stringified value from the API ("180") still lands
        // as a real number, and a missing/invalid field falls back to what's
        // already in state instead of silently becoming 0.
        setinfo((prev) => ({
          ...prev,
          age: Number(userData.age) || prev.age,
          gender: userData.gender ?? prev.gender,
          height: Number(userData.height) * 100 || prev.height,
          weight: Number(userData.weight) || prev.weight,
        }));
        setFormData((prev) => ({ ...prev, ...userData }));
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      })
      .finally(() => {
        // Only unlock the form once the fetch has actually settled (success
        // or failure) instead of immediately on mount — otherwise the user
        // can hit Calculate before their real age/height/weight ever arrive.
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setinfo((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  if (loading) return null;

  const diet_estimate = () => {
    setWarning(null);

    // --- Validation runs FIRST, before any calculation or state update. ---
    if (!info.Activitylevel) {
      alert("Please select Activity level");
      return;
    }
    if (!info.workoutsperweek) {
      alert("Please select workouts per week");
      return;
    }
    if (!info.goaldiet) {
      alert("Please select Goal diet");
      return;
    }
    if (!info.sleephour) {
      alert("Please add sleep hours");
      return;
    }
    if (!info.height || !info.weight || !info.age) {
      alert(
        "Missing height, weight, or age. These should have loaded from your profile — please fill them in above before calculating."
      );
      return;
    }

    const heightMeters = info.height / 100;
    const BMI = info.weight / (heightMeters * heightMeters);
    console.log(BMI)
    const bmiDeficit = BMI < 18.5 ? 0 : BMI < 25 ? 0.15 : BMI < 30 ? 0.2 : 0.25;

    const BMR =
      info.gender === "Male"
        ? 10 * info.weight + 6.25 * info.height - 5 * info.age + 5
        : 10 * info.weight + 6.25 * info.height - 5 * info.age - 161;

    const workoutDeficit =
      info.workoutsperweek < 2 ? 0.25 : info.workoutsperweek < 5 ? 0.2 : info.workoutsperweek < 7 ? 0.15 : 0.1;

    const sleepDeficit = info.sleephour < 5 ? 0.1 : info.sleephour < 7 ? 0.15 : info.sleephour < 9 ? 0.2 : 0.25;

    // True minimum of the three deficits. The previous if/else-if chain could
    // skip bmiDeficit entirely whenever workoutDeficit happened to beat
    // sleepDeficit, silently producing the wrong (too large) deficit.
    const minDeficit = Math.min(sleepDeficit, workoutDeficit, bmiDeficit);

    const activityFactor =
      info.Activitylevel === "SEDENTARY"
        ? 1.2
        : info.Activitylevel === "LIGHTLY_ACTIVE"
        ? 1.375
        : info.Activitylevel === "MODERATELY_ACTIVE"
        ? 1.55
        : info.Activitylevel === "VERY_ACTIVE"
        ? 1.725
        : 1.9;

    const TDEE = BMR * activityFactor;

    const macroTargetsByGoal: Record<string, { Protein: number; Fats: number; TargetCalories: number }> = {
      FAT_LOSS: { Protein: info.weight * 2, Fats: info.weight * 0.8, TargetCalories: TDEE * (1 - minDeficit) },
      MUSCLE_GAIN: { Protein: info.weight * 1.8, Fats: info.weight * 0.9, TargetCalories: TDEE * 1.1 },
      MAINTENANCE: { Protein: info.weight * 1.6, Fats: info.weight * 0.8, TargetCalories: TDEE },
      BODY_RECOMPOSITION: { Protein: info.weight * 1.8, Fats: info.weight * 0.8, TargetCalories: TDEE * 0.95 },
      PERFORMANCE_ENHANCEMENT: { Protein: info.weight * 2.2, Fats: info.weight * 0.9, TargetCalories: TDEE * 1.05 },
    };

    const { Protein, Fats, TargetCalories } =
      macroTargetsByGoal[info.goaldiet] ?? {
        Protein: info.weight * 1.6,
        Fats: info.weight * 0.8,
        TargetCalories: TDEE,
      };

    const rawCarbohydrates = (TargetCalories - (Protein * 4 + Fats * 9)) / 4;

    if (rawCarbohydrates < 0) {
      setWarning(
        "Your protein and fat targets already exceed the calorie target for this goal, so carbs were floored at 0g. This usually means the calorie target came out too low — double check height, age, and activity level above."
      );
    }

    const Carbohydrates = Math.max(0, rawCarbohydrates);

    const roundedCalories = Math.round(TargetCalories);
    const roundedFats = Math.round(Fats);
    const roundedProtein = Math.round(Protein);
    const roundedCarbs = Math.round(Carbohydrates);

    setinfo((prev) => ({
      ...prev,
      calories: roundedCalories,
      fats: roundedFats,
      protein: roundedProtein,
      carbohydrates: roundedCarbs,
    }));

    setFormData((prev) => ({
      ...prev,
      calories: roundedCalories,
      fats: roundedFats,
      protein: roundedProtein,
      carbohydrates: roundedCarbs,
      deadlift: info.deadlift,
      muscle_size: info.muscle_size,
      weight: info.weight,
    }));
console.log({ age: info.age, height: info.height, weight: info.weight, gender: info.gender, goal: info.goaldiet, BMI, BMR, TDEE, TargetCalories, Protein, Fats });

    openModal();
  };
  
  return (
    <ComponentCard title="Add diet">
      <form className="space-y-6">
        {/* <div className="grid grid-cols-3 gap-6">
          <div>
            <Label>Age</Label>
            <Input type="number" name="age" value={info.age} onChange={handleChange} />
          </div>

          <div>
            <MultiSelect
              label="Select gender"
              options={Genderoptions}
              onChange={(values) => setinfo((prev) => ({ ...prev, gender: values[0] }))}
            />
          </div>

          <div>
            <Label>Height (cm)</Label>
            <Input type="number" name="height" value={info.height} onChange={handleChange} />
          </div>
        </div> */}

        <div className="grid grid-cols-3 gap-6">
          <div className="relative z-52">
            <MultiSelect
              label="Select Goal diet"
              options={Goal_diet}
              onChange={(values) => setinfo((prev) => ({ ...prev, goaldiet: values[0] }))}
            />
          </div>

          <div className="relative z-52">
            <MultiSelect
              label="Activity level"
              options={Activitylevel}
              onChange={(values) => setinfo((prev) => ({ ...prev, Activitylevel: values[0] }))}
            />
          </div>

          <div className="relative z-52">
            <MultiSelect
              label="Workouts per week"
              options={workoutsperweek}
              onChange={(values) => setinfo((prev) => ({ ...prev, workoutsperweek: Number(values[0]) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* <div>
            <Label>Weight (kg)</Label>
            <Input type="number" name="weight" value={info.weight} onChange={handleChange} />
          </div> */}

          {info.goaldiet === "PERFORMANCE_ENHANCEMENT" && (
            <div>
              <Label>Deadlift number</Label>
              <Input type="number" name="deadlift" value={info.deadlift} onChange={handleChange} />
            </div>
          )}

          {(info.goaldiet === "MUSCLE_GAIN" || info.goaldiet === "BODY_RECOMPOSITION") && (
            <div>
              <Label>Muscle measure</Label>
              <Input type="number" name="muscle_size" value={info.muscle_size} onChange={handleChange} />
            </div>
          )}

          <div>
            <Label>Sleep hour</Label>
            <Input type="number" name="sleephour" value={info.sleephour} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-lg" onClick={diet_estimate}>
            Calculate the calories and Macros and generate diet
          </button>
        </div>
      </form>

      <div>
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Nutrition result</h4>

              {warning && <p className="mb-3 text-sm text-red-500">{warning}</p>}

              <p className="mb-3 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
                Your body should consume calories: {info.calories} kcal/day
              </p>
              <p className="mb-3 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
                Carbohydrates: {info.carbohydrates} gr/day
              </p>
              <p className="mb-3 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
                Protein: {info.protein} gr/day
              </p>
              <p className="mb-3 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
                Fats: {info.fats} gr/day
              </p>
            </div>
            <button
              type="button"
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
              onClick={() => {
                setFormData((prev) => ({ ...prev, goal_diet: info.goaldiet }));
                navigate("/consume_meal");
              }}
            >
              Let's go for consuming the Meal
            </button>
          </div>
        </Modal>
      </div>
    </ComponentCard>
  );
}
