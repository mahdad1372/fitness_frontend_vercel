import { useState,useEffect } from "react";
import ComponentCard from "../common/ComponentCard.tsx";
import Label from "../../components/form/Label.tsx";
import { useWorkout } from "../../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function Waiting_list() {
  const token = Cookies.get("token");
  const user_Id = Cookies.get("userId");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isInQueue, setIsInQueue] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [ waitlist,setwaitlist] = useState(false);
  const [ chatroomfree,setchatroomfree] = useState(false);
  const [ peoplewaiting,setpeoplewaiting] = useState(0);
  const { formData, setFormData, startWorkout } = useWorkout();
  const [formData2, setFormData2] = useState({
    user_id: 0,
    cholesterol: 0,
    blood_pressure: 0,
    heart_rate: 0,
  });
useEffect(() => {

  const fetchNumberPeople = async () => {
    try {
      const response = await fetch(
        "https://fitness-backend-15563671567.europe-west8.run.app/numberchatpeople",
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const num = await response.json();

      if(num < 2){
        setchatroomfree(true)
        setFormData(prev => ({
        ...prev,
        chatroomfree: true,
      }));
      }

  
    } catch (error) {
      console.error(error);
    }
  };

  // Execute immediately
  fetchNumberPeople();

  // Execute every 3 seconds
  const interval = setInterval(
    fetchNumberPeople,
    3000
  );

  // Cleanup when component unmounts
  return () => {
    clearInterval(interval);
  };
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
    //    setFormData(prev => ({
    //     ...prev,
    //     displaywaitlist: true,
    //   }));
    }
  }, [userId]);
useEffect(() => {

  const fetchWaitingList = async () => {

    try {
    const response = await fetch(
      `https://fitness-backend-15563671567.europe-west8.run.app/waitingroom/chatroom/${formData.chatroom_id_number}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if(response.ok){
    const results = await response.json();
    const positions = results.findIndex(
      (  item: { user_id: number; }) => item.user_id === Number(user_Id));
      setpeoplewaiting(positions+1);
   
    }
  

   
      // const waitlist = await fetch(
      //   "https://fitness-backend-15563671567.europe-west8.run.app/getwaitinglist"
      // );

      // const result = await waitlist.json();

      // const userId = Cookies.get("userId");
      // const index = result.findIndex(
      //   (item: number[]) =>
      //     item[0] === Number(userId)
      // );

      // if (index !== -1) {
      //   setpeoplewaiting(index + 1);
      // }
    
    } catch (error) {
      console.error(error);
    }
  };

  fetchWaitingList();

  const interval = setInterval(fetchWaitingList, 3000);

  return () => clearInterval(interval);

}, []);


const joinChatRoom = async () => {
  const userId = Cookies.get("userId");

  if (userId) {
    await fetch(
      "https://fitness-backend-15563671567.europe-west8.run.app/addpeople",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
        }),
      }
    );
      if (userId) {
    await fetch(
      "https://fitness-backend-15563671567.europe-west8.run.app/removewaitinglist",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
        }),
      }
    )};

    setFormData((prev) => ({
      ...prev,
      activechat: true,
    }));
    navigate("/chatbox");
  }
};
const addWaitingRoom = async () => {
  try {
    // First check if user is already in the queue
    const checkResponse = await fetch(
      `https://fitness-backend-15563671567.europe-west8.run.app/waitingroom/chatroom/${formData.chatroom_id_number}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (checkResponse.ok) {
      const waitingList = await checkResponse.json();
      const alreadyInQueue = waitingList.some(
        (item: { user_id: number }) => item.user_id === Number(user_Id)
      );

      if (alreadyInQueue) {

        return; // ← stop here, don't add again
      }
    }

    // Not in queue → add them
    const response = await fetch(
      "https://fitness-backend-15563671567.europe-west8.run.app/waitingroom/addwaitingroom",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatroom_id: formData.chatroom_id_number,
          user_id: Number(user_Id),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }


  } catch (error) {
    console.error(error);
  }
};

  if (loading) return null;
  return (
    <ComponentCard title="Sorry the chatroom is full">
      <form  className="space-y-6">
  

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="heart_rate">
                {formData.waiting_list === true ? "Your position in the queue is " +peoplewaiting : "Do you want to wait until chatroom become free?"}
                </Label>

          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="heart_rate">
                {formData.displaynotification === true ? "The chatroom become free do you want to join " : ""}
                </Label>

          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
<button
  type="button"
  onClick={
    async () => {
  if (userId) {
    await addWaitingRoom();
    setFormData(prev => ({ ...prev, waiting_list:true}))
    
  }
  if(formData.displaynotification === true){
    navigate("/chatbox")
  }
    }}
// onClick={async () => {
//   if (!chatroomfree) {
//     setwaitlist(true);
//     const userId = Cookies.get("userId");
//    const waitlist = await fetch(`https://fitness-backend-15563671567.europe-west8.run.app/getwaitinglist`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//     const result = await waitlist.json();
//       const firstNumbers: number[] = result.map(item => item[0]);
//        if (!firstNumbers.includes(Number(userId))) {
//           localStorage.removeItem(
//            "turnNotified"
//             );
//           fetch(
//            "https://fitness-backend-15563671567.europe-west8.run.app/addwaitinglist",
//            {
//              method: "POST",
//              headers: {
//                "Content-Type":
//                  "application/json",
//              },
//              body: JSON.stringify({
//                userId: Number(userId),
//              }),
//            }
//          )};
//   } else {
//     joinChatRoom();
//   }
// }}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
>
  Yes
</button>
         <button
          
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            No
            
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
