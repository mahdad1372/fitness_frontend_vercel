import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Alerts from "./pages/UiElements/Alerts";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Worksouttable from "./pages/Tables/WorkoutsTables";
import HealthmetricsTabls from "./pages/Tables/HealthmetrixTables";
import GoalTables from "./pages/Tables/GoalTables";
import FoodTables from "./pages/Tables/FoodTables";
import Formgymexercise from "./pages/Forms/Formgymexercise";
import Trackworkouts from "./components/tables/BasicTables/Trackworkouts";
import { WorkoutProvider } from "./context/WorkoutContext";
import Formdiet from "./pages/Forms/FormDiet";
import FormMealConsume from "./pages/Forms/FormMealConsume";
import Formweight from "./pages/Forms/Form_evaluation_diet";
import FormGym from "../src/pages/Forms/FormGym";
import AIRecommendation from "../src/pages/Forms/AIRecommendation";
import ForTrainingGym from "./pages/Forms/FormTrainingGym";
import ChatBox from "./components/Chats/ChatBox";
import Waiting_list from "./components/Chats/waiting_list";
import Servicetables from "./pages/Tables/ServiceTables";
import AIChatPage from "./pages/Chats/AIChatPage";
import ExerciseLibrary from "./pages/ExerciseGraph/ExerciseLibrary";
import FindSubstitute from "./pages/ExerciseGraph/FindSubstitute";
import ProgressionRoadmap from "./pages/ExerciseGraph/ProgressionRoadmap";
import SmartWeeklyPlanner from "./pages/WeeklyPlanner/SmartWeeklyPlanner";
import SmartMealPlanner from "./pages/MealPlanner/SmartMealPlanner";
import CardiovascularRiskPage from "./pages/CardiovascularRisk/CardiovascularRiskPage";
import ResourceSchedulerPage from "./pages/ResourceScheduler/ResourceSchedulerPage";
export default function App() {
  return (
    <>
      <Router>
          <WorkoutProvider>
        <ScrollToTop />
        <Routes>
          <Route index path="/" element={<SignIn />} />
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/cardiovascular-risk" element={<CardiovascularRiskPage />} />
            <Route path="/exercise-library" element={<ExerciseLibrary />} />
            <Route path="/find-substitute" element={<FindSubstitute />} />
            <Route path="/progression-roadmap" element={<ProgressionRoadmap />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/workouts-tables" element={<Worksouttable />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/smart-weekly-planner" element={<SmartWeeklyPlanner />} />
            <Route path="/service-tables" element={<Servicetables />} />
            <Route path="/health-tables" element={<HealthmetricsTabls />} />
            <Route path="/smart-meal-planner" element={<SmartMealPlanner />} />
            <Route path="/goal-tables" element={<GoalTables />} />
            <Route path="/food-tables" element={<FoodTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/addworkouts" element={<Formgymexercise/>} />
            <Route path="/trackworkouts" element={<Trackworkouts/>} />
            <Route path="/adddiet" element={<Formdiet/>} />
            <Route path="/consume_meal" element={<FormMealConsume/>}/>
            <Route path="/evaluate_weight" element={<Formweight />}/>
            <Route path="/addgymscheduale" element={<FormGym/>}/>
            <Route path="/traininggym" element={<ForTrainingGym/>}/>
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/getrecommend" element={<AIRecommendation />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/chatbox" element={<ChatBox />} />
            <Route path="/aichat" element={<AIChatPage />} />
            <Route path="/Waitinglist" element={<Waiting_list />} />
            <Route path="/resource-scheduler" element={<ResourceSchedulerPage />} />
          </Route>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </WorkoutProvider>
      </Router>
    </>
  );
}