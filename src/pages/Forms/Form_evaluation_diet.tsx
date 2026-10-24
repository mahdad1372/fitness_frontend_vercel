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

export default function Formdiet() {
  const { formData, setFormData, startWorkout } = useWorkout();
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();
  const [info, setinfo] = useState({
    age: 0,
    gender: "",
    height: 0,
    weight: 0,
    goaldiet:"",
    header:"",
    deadlift:0,
    muscle_size:0
  });
  const [status, setstatus] = useState("");

  useEffect(() => {
    const id = Cookies.get("userId");
    if (id) setUserId(Number(id));
    setLoading(false);
    if(formData.goal_diet === "FAT_LOSS"){
      setinfo(prev => ({...prev, header: "Weight Evaluation"}));
    }else if(formData.goal_diet === "MUSCLE_GAIN"){
        setinfo(prev => ({...prev, header: "Muscle Evaluation"}));
    }else if(formData.goal_diet === "MAINTENANCE"){
        setinfo(prev => ({...prev, header: "Weight Evaluation"}));
    }else if(formData.goal_diet === "BODY_RECOMPOSITION"){
        setinfo(prev => ({...prev, header: "Muscle , Weight Evaluation"}));
    }else {
      setinfo(prev => ({...prev, header: "Performance Evaluation"}));
    }
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


  const calculatetheweight = () => {
    if (formData.goal_diet == "FAT_LOSS"){
      if(formData.weight >  info.weight){
        setstatus("Great the weight decrease and you have reached your aim")
      }else if(formData.weight == info.weight){
            setstatus("There is no any difference it's better to change you diet")
      }else{
        setstatus("The result is completly mistake your weight is increasing so create your diet again")
      }
    }
     if (formData.goal_diet == "Gain weight"){
      if(formData.weight > info.weight){
        setstatus("The result is completly mistake your weight is decreased so create your diet again")
      }else if(formData.weight == info.weight){
            setstatus("There is no any difference it's better to change you diet")
      }else{
        setstatus("Great the weight increase and yOU have reached your aim")
      }
    }
    if (formData.goal_diet == "MAINTENANCE"){
      if(formData.weight > info.weight){
        setstatus("The result is completly mistake your weight is changed so create your diet again")
      }else if(formData.weight == info.weight){
            setstatus("Great the weight remain stable and you have reached your aim")
      }else{
        setstatus("The result is completly mistake your weight is changed so create your diet again")
      }
    }

      if (formData.goal_diet == "MUSCLE_GAIN"){
        if(formData.muscle_size < info.muscle_size){
              setstatus("Greate you have reached to your aim which is the muscle gain")
        }else{
              setstatus("Sorry you are mistake you didn't reach to your aim which is the muscle gain")
        }
      }
      if (formData.goal_diet == "BODY_RECOMPOSITION"){
        if(formData.muscle_size < info.muscle_size && formData.weight > info.weight){
              setstatus("Greate you have reached to your aim which is the BODY_RECOMPOSITION")
        }else{
              setstatus("Sorry you are mistake you didn't reach to your aim which is the BODY_RECOMPOSITION")
        }
      }
      if (formData.goal_diet == "PERFORMANCE_ENHANCEMENT"){
        if(formData.deadlift < info.deadlift ){
              setstatus("Greate you have reached to your aim which is the PERFORMANCE_ENHANCEMENT")
        }else{
              setstatus("Sorry you are mistake you didn't reach to your aim which is the PERFORMANCE_ENHANCEMENT")
        }
      }
    openModal();
  }

 
  return (
    <ComponentCard title={info.header}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {formData.goal_diet === "PERFORMANCE_ENHANCEMENT" && (
          <div>
          <Label>Deadlift number</Label>
          <Input
          type="number"
          name="deadlift"
          value={info.deadlift}
          onChange={handleChange}
          />
          </div>
          )}
        {formData.goal_diet === "MUSCLE_GAIN" && (
          <div>
          <Label>Muscle size</Label>
          <Input
          type="number"
          name="muscle_size"
          value={info.muscle_size}
          onChange={handleChange}
          />
          </div>
          )}
          {formData.goal_diet === "BODY_RECOMPOSITION" && (
          <div>
          <Label>Muscle measure</Label>
          <Input
          type="number"
          name="muscle_size"
          value={info.muscle_size}
          onChange={handleChange}
          />
          </div>
          )}
          {formData.goal_diet === "BODY_RECOMPOSITION" && (
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              name="weight" 
              value={info.weight}
              onChange={handleChange}
            />
          </div>
           )}
        {formData.goal_diet === "FAT_LOSS" && (
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              name="weight" 
              value={info.weight}
              onChange={handleChange}
            />
          </div>
           )}
        {formData.goal_diet === "MAINTENANCE" && (
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              name="weight" 
              value={info.weight}
              onChange={handleChange}
            />
          </div>
           )}
          {formData.goal_diet === "PERFORMANCE_ENHANCEMENT" && (
          <div>
            <Label>Deadlift</Label>
            <Input
              type="number"
              name="deadlift" 
              value={info.deadlift}
              onChange={handleChange}
            />
          </div>
           )}
        </div>
        {/* Submit */}
        <div className="grid grid-cols-4 gap-6">
        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
          onClick={calculatetheweight}
        >
          Evaluate the goal achieving
        </button>
          </div>

      </form>
      <div>
      <Modal isOpen={isOpen} onClose={() => {
            closeModal();
        }}
     className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Weight result
            </h4>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
             Your body status is this : {status}
            </p>

          </div>
        </div>
      </Modal>
      </div>
    </ComponentCard>
  );
}