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
export default function FormGym() {
  const { formData, setFormData, startWorkout } = useWorkout();
  const [loading, setLoading] = useState(true);
  const {isOpen, openModal, closeModal } = useModal();
  const [userId, setUserId] = useState<number | null>(null);
  const [finalgoal, setfinalgoal] = useState("");
  const navigate = useNavigate();
  const [info, setinfo] = useState({
    age: 0,
    gender: "",
    height: 0,
    weight: 0,
    waist:0,
    BodyType:"",
    goaldiet:"",
    pushups:0,
    pullups:0,
    steps:0,
    workouts_per_week:"",
    can_do_bodyweight_squat:"",
    activity_level:"",
    stair_fatigue:"",
    sleep_quality:"",
    stress_level:""
  });
  const BodyType = [
    { value: "skinny", text: "skinny" },
    { value: "skinny_fat", text: "skinny_fat" },
    { value: "average", text: "average" },
    { value: "overweight", text: "overweight" },
    { value: "muscular", text: "muscular" }
  ];

  const exercisesOptions = [
    { value: "Yes", text: "Yes" },
    { value: "No", text: "No" },

  ];
    const activitylevel = [
    { value: "sedentary", text: "sedentary" },
    { value: "lightly_active", text: "lightly_active" },
    { value: "moderate", text: "moderate" },
    { value: "high", text: "high" },
  ];
    const stair_fatigue = [
    { value: "low", text: "low" },
    { value: "medium", text: "medium" },
    { value: "high", text: "high" },
  ];
    const sleep_quality = [
    { value: "poor", text: "poor" },
    { value: "average", text: "average" },
    { value: "good", text: "good" },
  ];
    const stress_level = [
    { value: "low", text: "low" },
    { value: "medium", text: "medium" },
    { value: "high", text: "high" },
  ];
  const workouts_per_week = [
    { value: "0", text: "0"},
    { value: "1", text: "1" },
    { value: "2", text: "2" },
    { value: "3", text: "3" },
    { value: "4", text: "4" },
    { value: "5", text: "5" },
    { value: "6", text: "6" },
    { value: "7", text: "7" },
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

    setinfo(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };
  const calculation = () => {
    
    const bmi = info.weight/((info.height^2)/100);
    const Waist_to_Height_Ratio =  info.waist/info.height;
    var muscle_gain = 0
    var fat_loss = 0
    var strength = 0
    var fitness = 0 
    var recomposition = 0
    setFormData(prev => ({ ...prev, height: info.height}))
    setFormData(prev => ({ ...prev, bmi: bmi}))
    if(bmi < 18.5 ){
      muscle_gain += 4
    }
    if(info.BodyType == "skinny"){
      muscle_gain += 4
    }
    if(info.pushups < 10){
      muscle_gain += 2
    }
    if(info.pushups < 10){
      muscle_gain += 2
    }
    if(info.pullups == 0){
      muscle_gain += 2
    }
    if(info.can_do_bodyweight_squat == "No"){
      muscle_gain += 1
    }
    if(Waist_to_Height_Ratio < 0.43){
      muscle_gain += 2
    }
    if(info.steps < 5000){
      muscle_gain += 1
       fat_loss += 1
    }
    if(bmi > 27){
      fat_loss +=4
    }
    if(Waist_to_Height_Ratio > 0.52){
      fat_loss += 5
    }
    if(info.BodyType == "overweight"){
      fat_loss += 4

    }
    if(info.stair_fatigue == "high"){
      fat_loss += 2
    }
    if(info.activity_level == "sedentary"){
      fat_loss += 2
    }
    if(Number(info.workouts_per_week) == 0){
      fat_loss += 1
    }
    if(info.pushups > 20){
      strength += 3
    }
    if(info.pullups > 5){
      strength += 3
    }
    if(info.can_do_bodyweight_squat == "Yes"){
      strength += 1
    }
    if(Number(info.workouts_per_week) >= 3){
      strength += 2
    }
    if(info.BodyType == "muscular"){
      strength += 4
    }
    if(info.activity_level == "high"){
      strength += 2
    }
    if(info.stair_fatigue == "high"){
      fitness += 4
    }
    if(info.activity_level == "sedentary"){
      fitness += 3
    }
    if(info.steps < 5000){
      fitness += 2
    }
    if(Number(workouts_per_week) == 0){
      fitness += 2
    }
    if(info.sleep_quality == "poor"){
      fitness += 1
    }
    if(info.stress_level == "high"){
      fitness += 1
    }
    if(info.BodyType == "skinny_fat"){
      recomposition += 5
    }
    if(bmi >= 20 && bmi <= 27){
      recomposition += 2
    }
    if(Waist_to_Height_Ratio >= 0.45 && Waist_to_Height_Ratio <= 0.55){
      recomposition += 3
    }
    if(info.pushups < 15){
      recomposition += 1
    }
    if(info.activity_level == "sedentary"){
       recomposition += 1
    }

 const score: { [key: string]: number }[] = [
  { muscle_gain: muscle_gain },
  { fat_loss: fat_loss },
  { strength: strength },
  { fitness: fitness },
  { recomposition: recomposition }
]; 
    const maxCategory = score.reduce((max, current) => {

      const maxKey = Object.keys(max)[0] as keyof typeof max;
      const currentKey = Object.keys(current)[0] as keyof typeof current;

    return current[currentKey] > max[maxKey]
      ? current
      : max;

    });
    const category = Object.keys(maxCategory)[0];
    setfinalgoal(category);
    setFormData(prev => ({ ...prev, goal_gym: category}))
    openModal();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    calculation();
  };
  if (loading) return null;
  return (
    <ComponentCard title="Gym">
      <form onSubmit={handleSubmit} className="space-y-6">

     <div className="grid grid-cols-4 gap-6">
      <div className="relative z-52">
        <MultiSelect
          label="BodyType"
          options={BodyType}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, BodyType: values[0] }))
          }
        />
        </div>
        <MultiSelect
          label="can do body weight_squat"
          options={exercisesOptions}
          onChange={(values) =>{
            setinfo(prev => ({ ...prev, can_do_bodyweight_squat: values[0] }))
          }}
        />
        <MultiSelect
          label="Activity Level"
          options={activitylevel}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, activity_level: values[0] }))
          }
        />
        <MultiSelect
          label="stair fatigue"
          options={stair_fatigue}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, stair_fatigue: values[0] }))
          }
        />
     </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              name="age"
              value={info.age}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Height (cm)</Label>
            <Input
              type="number"
              name="height"
              value={info.height}
              
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              name="weight"
              value={info.weight}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Waist (cm)</Label>
            <Input
              type="number"
              name="waist"
              value={info.waist}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-4  gap-6">
        <div>
          <Label>pushups counts</Label>
          <Input
            type="number"
            name="pushups"
            value={info.pushups}
            onChange={handleChange}
          />
        </div>
        <div>
          <div className="relative z-52">
        <MultiSelect
          label="workouts_per_week"
          options={workouts_per_week}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, workouts_per_week: values[0] }))
          }
        />
        </div>
        </div>
          <div>
          <Label>pullups counts</Label>
          <Input
            type="number"
            name="pullups"
            value={info.pullups}
            onChange={handleChange}
          />
        </div>
          <div>
          <Label>Steps per day</Label>
          <Input
            type="number"
            name="steps"
            value={info.steps}
            onChange={handleChange}
          />
        </div>
        </div>
        <div className="grid grid-cols-4  gap-6">
        <MultiSelect
          label="sleep_quality"
          options={sleep_quality}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, sleep_quality: values[0] }))
          }
        />
        <MultiSelect
          label="stress_level"
          options={stress_level}
          onChange={(values) =>
            setinfo(prev => ({ ...prev, stress_level: values[0] }))
          }
        />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Generaare the Aim
        </button>
      </form>
            <Modal isOpen={isOpen} onClose={() => {
                  closeModal();
              }}
           className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                  <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  Gym scheduale aim
                  </h4>
                  <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
                  After the evaluation your body should follow {finalgoal} patterns
                  </p>
                </div>
                <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg"
                onClick={()=>{
                  setFormData(prev => ({
                  ...prev,
                  goal_diet: finalgoal,}));
                  navigate("/traininggym")
                }}
                >
                Let's go fir the weekly scheduale base on the Aim
              </button>
              </div>
            </Modal>
    </ComponentCard>
  );
}