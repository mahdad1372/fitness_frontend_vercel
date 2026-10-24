import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import MultiSelect from "../../components/form/MultiSelect";
import Cookies from "js-cookie";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useWorkout } from "../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import food from "../../food.json";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
export default function FormMealConsume() {
  const { formData, setFormData, startWorkout } = useWorkout();
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [userId, setUserId] = useState<number | null>(null);
  const [evaluation,setevaluation] = useState("");
  const [buttontxt,setbuttontxt] = useState("Click here to know your final evaluation");
  const navigate = useNavigate();
  type FoodItem = {
  name: string;
  gram: number;
};
  type ProteinItem = {
  name: string;
  gram: number;
};
  type FruitItem = {
  name: string;
  gram: number;
};

  type vegetablesItem = {
  name: string;
  gram: number;
};
  const [grain,setgrain] = useState("");
  const [graingram, setgraingram] = useState(0);
  const [GrainList, setGrainList] = useState<FoodItem[]>([]);
  const [protein,setprotein] = useState("");
  const [proteingram, setproteingram] = useState(0);
  const [ProteinList, setProteinList] = useState<ProteinItem[]>([]);
  const [fruit,setfruit] = useState("");
  const [fruitgram, setfruitgram] = useState(0);
  const [fruitList, setfruitList] = useState<FruitItem[]>([]);

  const [vegetables,setvegetables] = useState("");
  const [vegetablesgram, setvegetablesgram] = useState(0);
  const [vegetablesList, setvegetablesList] = useState<vegetablesItem[]>([]);
  const [finalprotein, setfinalprotein] = useState(0);
  const [finalfat, setfinalfat] = useState(0);
  const [finalcholestrol, setfinalcholestrol] = useState(0);
  const [finalcharbohyrdate, setfinalcharbohyrdate] = useState(0);
  const Grain = food.categories.Grains.map((item) => ({
  value: item.name,
  text: item.name
    }));
    const Fruits =food.categories.Fruits.map((item) => ({
  value: item.name,
  text: item.name
    }));
    const Vegetables = food.categories.Vegetables.map((item) => ({
  value: item.name,
  text: item.name
    }));

  const Protein = food.categories.Protein.map((item) => ({
  value: item.name,
  text: item.name
    }));
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
  
const handleAddFruit= (): void => {
    if (!fruit || fruitgram <= 0) return;

    const newFood = {
      name: fruit,
      gram: fruitgram,
    };

    setfruitList([...fruitList, newFood]);

    // Reset Inputs
    setfruit("");
    setfruitgram(0);
  };
const handleAddProtein = (): void => {
    if (!protein || proteingram <= 0) return;

    const newFood = {
      name: protein,
      gram: proteingram,
    };

    setProteinList([...ProteinList, newFood]);

    // Reset Inputs
    setprotein("");
    setproteingram(0);
  };
const handleAddFood = (): void => {
    if (!grain || graingram <= 0) return;

    const newFood = {
      name: grain,
      gram: graingram,
    };
    setGrainList([...GrainList, newFood]);
    setgrain("");
    setgraingram(0);
  };
  const handleAddVegetables = (): void => {
    if (!vegetables || vegetablesgram <= 0) return;

    const newFood = {
      name: vegetables,
      gram: vegetablesgram,
    };
    setvegetablesList([...vegetablesList, newFood]);
    setvegetables("");
    setvegetablesgram(0);
  };
const evaluate_score = (num1: number) => {
  if(num1 >= 90){
      if(formData.goal_diet === "FAT_LOSS"){
      setbuttontxt("Let's measure your current weight")
    }else if(formData.goal_diet === "MUSCLE_GAIN"){
      setbuttontxt("Let's measure your current muscle size")
    }else if(formData.goal_diet === "BODY_RECOMPOSITION"){
      setbuttontxt("Let's measure your current weight and muscle size")
    }else if(formData.goal_diet === "PERFORMANCE_ENHANCEMENT"){
      setbuttontxt("Let's measure your power and performance")
    }else{
    setbuttontxt("Let's measure your current weight")
    }
    setevaluation("Excellent, you done your diet completely");
  }
  if(num1>75 && num1<90){
    if(formData.goal_diet === "FAT_LOSS"){
      setbuttontxt("Let's measure your current weight")
    }else if(formData.goal_diet === "MUSCLE_GAIN"){
      setbuttontxt("Let's measure your current muscle size")
    }else if(formData.goal_diet === "BODY_RECOMPOSITION"){
      setbuttontxt("Let's measure your current weight and muscle size")
    }else if(formData.goal_diet === "PERFORMANCE_ENHANCEMENT"){
      setbuttontxt("Let's measure your power and performance")
    }else{
    setbuttontxt("Let's measure your current weight")
    }
  setevaluation("Very good you have followed your diet");
  }
  if(num1>50 && num1<75){
    setbuttontxt("Let's go to adjeust the plan food consuming again ")
    setevaluation("Needs Improvement your diet");
  }
  if(num1 < 50){
    setbuttontxt("Let's go to adjeust the plan food consuming again ")
    setevaluation("Poor");
  }
};
const evaluation_button = (num1: number) => {
      evaluate_score(num1);
      openModal();
}
const handleRemoveGrain = (index: number): void => {
  const updatedList = GrainList.filter((_, i) => i !== index);
  setGrainList(updatedList);
};

const handleRemoveProtein = (index: number): void => {
  const updatedList = ProteinList.filter((_, i) => i !== index);
  setProteinList(updatedList);
};
const handleRemoveFruit= (index: number): void => {
  const updatedList = fruitList.filter((_, i) => i !== index);
  setfruitList(updatedList);
};
const handleRemoveVegetables= (index: number): void => {
  const updatedList = vegetablesList.filter((_, i) => i !== index);
  setvegetablesList(updatedList);
};
const adherence_score = (num1: number,num2: number)=>{
  let adherence = num1/num2 
  return adherence * 100
}

const average_adherence = (num1: number,num2: number,num3:number,num4:number)=>{
  let average = num1 + num2 + num3 + num4
  return average/4
}
const button_navigation_click = () => {
  if(evaluation == "Excellent, you done your diet completely" || evaluation == "Very good you have followed your diet"){
   navigate("/evaluate_weight");
  }
}
const calculate_macros = ()=>{
  var protein = 0
  var fats = 0
  var calories = 0
  var carbohydrates = 0
  GrainList.forEach(element => {
    protein += food.categories.Grains.filter(item => item.name === element.name)[0].protein_g * element.gram
    fats += food.categories.Grains.filter(item => item.name === element.name)[0].fats_g * element.gram
    calories += food.categories.Grains.filter(item => item.name === element.name)[0].kcal * element.gram
    carbohydrates += food.categories.Grains.filter(item => item.name === element.name)[0].carbohydrates_g * element.gram
  });
  fruitList.forEach(element => {
    protein += food.categories.Fruits.filter(item => item.name === element.name)[0].protein_g * element.gram
    fats += food.categories.Fruits.filter(item => item.name === element.name)[0].fats_g * element.gram
    calories += food.categories.Fruits.filter(item => item.name === element.name)[0].kcal * element.gram
    carbohydrates += food.categories.Fruits.filter(item => item.name === element.name)[0].carbohydrates_g * element.gram
  });
  ProteinList.forEach(element => {
    protein += food.categories.Protein.filter(item => item.name === element.name)[0].protein_g * element.gram
    fats += food.categories.Protein.filter(item => item.name === element.name)[0].fats_g * element.gram
    calories += food.categories.Protein.filter(item => item.name === element.name)[0].kcal * element.gram
    carbohydrates += food.categories.Protein.filter(item => item.name === element.name)[0].carbohydrates_g * element.gram
  });
  vegetablesList.forEach(element => {
    protein += food.categories.Vegetables.filter(item => item.name === element.name)[0].protein_g * element.gram
    fats += food.categories.Vegetables.filter(item => item.name === element.name)[0].fats_g * element.gram
    calories += food.categories.Vegetables.filter(item => item.name === element.name)[0].kcal * element.gram
    carbohydrates += food.categories.Vegetables.filter(item => item.name === element.name)[0].carbohydrates_g * element.gram
  });
  setfinalprotein(protein)
  setfinalfat(fats)
  setfinalcharbohyrdate(carbohydrates)
  setfinalcholestrol(calories)
  openModal();
}

  return (
    <ComponentCard title="Meal consume">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2>Meal</h2>
        <div className="grid grid-cols-4 gap-6" >
          <div className="relative z-20">
        <MultiSelect
          label="Select Grain"
          options={Grain}
          onChange={(e) => {
            setgrain(e[0])
          }}
        />
          </div>
          <div>
            <Label>Grain gram</Label>
            <Input
              type="number"
              name="Grain"
             onChange={(e) => {
              setgraingram(Number(e.target.value))
               }}
            />
          </div>
          <div>
        <button
        onClick={handleAddFood}
          type="button"
        className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6"
        >
          Add to Grain List
        </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6" >
          <div className="relative z-19">
        <MultiSelect
          label="Select Protein"
          options={Protein}
          onChange={(e) => {
            setprotein(e[0])
          }}
        />
          </div>
          <div>
            <Label>Protein gram</Label>
            <Input
              type="number"
              name="Protein"
             onChange={(e) => {
              setproteingram(Number(e.target.value))
               }}
            />
          </div>
          <div>
        <button
        onClick={handleAddProtein}
          type="button"
        className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6"
     
        >
          Add to Protein List
        </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6" >
          <div className="relative z-18">
        <MultiSelect
          label="Select Fruits"
          options={Fruits}
          onChange={(e) => {
            setfruit(e[0])
          }}
        />
          </div>
          <div>
            <Label>Fruits gram</Label>
            <Input
              type="number"
              name="Fruits"
             onChange={(e) => {
              setfruitgram(Number(e.target.value))
               }}
            />
          </div>
          <div>
        <button
        onClick={handleAddFruit}
          type="button"
        className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6"
     
        >
          Add to Fruit List
        </button>
          </div>
        </div>

      <div className="grid grid-cols-4 gap-6" >
          <div className="relative z-18">
        <MultiSelect
          label="Select Vegetables"
          options={Vegetables}
          onChange={(e) => {
            setvegetables(e[0])
          }}
        />
          </div>
          <div>
            <Label>Vegetables gram</Label>
            <Input
              type="number"
              name="Vegetables"
             onChange={(e) => {
              setvegetablesgram(Number(e.target.value))
               }}
            />
          </div>
          <div>
        <button
        onClick={handleAddVegetables}
          type="button"
        className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6"
     
        >
          Add to Vegetables List
        </button>
          </div>
        </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Grain
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
               Gram
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Remove
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {GrainList.map((value,index) => (
              <TableRow key={index}>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {value.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {value.gram}
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                <button
                onClick={() => handleRemoveGrain(index)}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                >
                Remove
                </button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Protein
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
               Gram
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Remove
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {ProteinList.map((value,index) => (
              <TableRow key={index}>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {value.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {value.gram}
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                <button
                onClick={() => handleRemoveProtein(index)}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                >
                Remove
                </button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Fruit
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
               Gram
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Remove
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {fruitList.map((value,index) => (
              <TableRow key={index}>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {value.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {value.gram}
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                <button
                onClick={() => handleRemoveFruit(index)}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                >
                Remove
                </button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Vegetables
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
               Gram
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Remove
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {vegetablesList.map((value,index) => (
              <TableRow key={index}>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {value.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {value.gram}
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                <button
                onClick={() => handleRemoveVegetables(index)}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                >
                Remove
                </button>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
        <div className="grid grid-cols-2 gap-6">
        <button
        onClick={calculate_macros}
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
         Calculate with the adherence score and make the comparison with the diet 
        </button>
          </div>
      </form>
      <div>
      <Modal isOpen={isOpen} onClose={() => {
            setfinalfat(0);
            setfinalcholestrol(0);
            setfinalcharbohyrdate(0);
            setfinalprotein(0);
            setevaluation("");
            setbuttontxt("Click here to know your final evaluation");
            closeModal();
        }}
     className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Compare Planned vs Actual
            </h4>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
              Here we make the comparison between the actual consumed and target 
            </p>
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            actual vs target
            </h4>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
            Calories : {finalcholestrol.toFixed(2)} kcal/ {formData.calories.toFixed(2)} kcal , 
            {parseFloat(adherence_score(finalcholestrol,formData.calories).toFixed(2)) > 100 ? "You have consumed more that the targer": 
            parseFloat(adherence_score(finalcholestrol,formData.calories).toFixed(2)) < 100 ? "You have consumed less than the target":
            "Good"
            } 
           
            </p>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
             Carbohydrates : {finalcharbohyrdate.toFixed(2)} gr/ {formData.carbohydrates.toFixed(2)} gr , 
            {parseFloat(adherence_score(finalcharbohyrdate,formData.carbohydrates).toFixed(2)) > 100 ? "You have consumed more that the targer": 
            parseFloat(adherence_score(finalcharbohyrdate,formData.carbohydrates).toFixed(2)) < 100 ? "You have consumed less than the target":
            "Good"
            } 
            </p>
             <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
            Protein : {finalprotein.toFixed(2)} gr/ {formData.protein.toFixed(2)} gr , 
            {parseFloat(adherence_score(finalprotein,formData.protein).toFixed(2)) > 100 ? "You have consumed more that the targer": 
            parseFloat(adherence_score(finalprotein,formData.protein).toFixed(2)) < 100 ? "You have consumed less than the target":
            "Good"
            } 
            </p>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
            fats : {finalfat.toFixed(2)} gr/ {formData.fats.toFixed(2)} gr , 
            {parseFloat(adherence_score(finalfat,formData.fats).toFixed(2)) > 100 ? "You have consumed more that the targer": 
            parseFloat(adherence_score(finalfat,formData.fats).toFixed(2)) < 100 ? "You have consumed less than the target":
            "Good"
            } 
            </p>
                      
           <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
            Final adherence is this : {parseFloat(average_adherence(
              Number(adherence_score(finalcharbohyrdate,formData.carbohydrates).toFixed(2))
            ,Number(adherence_score(finalprotein,formData.protein).toFixed(2)),
            Number(adherence_score(finalcholestrol,formData.calories).toFixed(2)),
            Number(adherence_score(finalfat,formData.fats).toFixed(2))).toFixed(2)) > 100 ? 100
          : average_adherence(
              Number(adherence_score(finalcharbohyrdate,formData.carbohydrates).toFixed(2))
            ,Number(adherence_score(finalprotein,formData.protein).toFixed(2)),
            Number(adherence_score(finalcholestrol,formData.calories).toFixed(2)),
            Number(adherence_score(finalfat,formData.fats).toFixed(2))).toFixed(2)} %
            </p>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400 lg:mb-7">
              Evaluation is : {evaluation}
            </p>
          <button
          type="button"
          className="w-100 bg-green-600 text-white py-3 rounded-lg"
          onClick={()=>{
            evaluation_button(average_adherence(
              Number(adherence_score(finalcharbohyrdate,formData.carbohydrates).toFixed(2))
            ,Number(adherence_score(finalprotein,formData.protein).toFixed(2)),
            Number(adherence_score(finalcholestrol,formData.calories).toFixed(2)),
            Number(adherence_score(finalfat,formData.fats).toFixed(2))))
            button_navigation_click();
          }}
        >
         {buttontxt}
        </button>
          </div>
        </div>
      </Modal>
      </div>
    </ComponentCard>
  );
}