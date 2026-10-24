import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import { useWorkout } from "../../context/WorkoutContext";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Waiting_list from "./waiting_list";


interface ChatMessage {
  sender: string;
  content?: string;
  type: "CHAT" | "JOIN" | "LEAVE" | "FULL";
}

const ChatBox: React.FC = () => {
  const navigate = useNavigate();
  const [chatroomnumber, setchatroomnumber] = useState(0);
  const [content, setContent] = useState("");
  const [sender, setSender] = useState("");
  const [userjoint,setuserjoint] = useState(false);
  const[displaychat, setdisplaychat] = useState( "inline-block");
  const [isJoined, setIsJoined] = useState(false);
  const [countpeople, setcountpeople] = useState(0);
  
  const [connected, setConnected] =
    useState(false);
  const [occupied, setOccupied] =
    useState(false);
  const [client, setClient] =
    useState<Client | null>(null);

  const senderRef = useRef("");

  const { formData, setFormData } =
    useWorkout();

  useEffect(() => {
    senderRef.current = sender;
  }, [sender]);

const calledRef = useRef(false);

useEffect(() => {
  const initializeChat = async () => {
    try {
      const token = Cookies.get("token");
      const userId = Cookies.get("userId");
      const role = Cookies.get("userrole");
       localStorage.setItem("turnNotified","No");
      if(formData.chatroom__free === true && role === "USER"){
          await fetch(
          `https://fitness-backend-15563671567.europe-west8.run.app/waitingroom/deletewaitingroom/${Number(userId)}`,
          {
          method: "DELETE",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          }
        }
      );
        await fetch(
          `https://fitness-backend-15563671567.europe-west8.run.app/chatroom/updatechatroom/${formData.chatroom_id_number}`,
          {
          method: "PUT",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
          coach_id: Number(formData.chatroomnumber),
          user_id: Number(userId),
        }),
        }
      );
  
      }else {
        if(formData.chatroom__free === false && role === "USER"){
        setFormData(prev => ({ ...prev, waiting_list: false }))  
        navigate("/Waitinglist");
      }}
      if (!token || !userId) {
        return;
      }

      // Check room size FIRST
      const countResponse = await fetch(
        "https://fitness-backend-15563671567.europe-west8.run.app/numberchatpeople"
      );

      const count = await countResponse.json();

      setcountpeople(count);

      // if (count > 2) {
      //   navigate("/Waitinglist");
      //   return;
      // }

      // Only add user if room is not full
      // const addResponse = await fetch(
      //   "https://fitness-backend-15563671567.europe-west8.run.app/addpeople",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type":
      //         "application/json",
      //     },
      //     body: JSON.stringify({
      //       userId: Number(userId),
      //     }),
      //   }
      // );

      // if (!addResponse.ok) {
      //   navigate("/Waitinglist");
      //   return;
      // }

      const response = await fetch(
        "https://fitness-backend-15563671567.europe-west8.run.app/users/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const user = await response.json();

      setSender(
        `${user.firstname} ${user.lastname}`
      );

      setFormData((prev) => ({
        ...prev,
        activechat: true,
      }));
      setFormData((prev) => ({
        ...prev,
        displaynotification: false,
      }));

    } catch (error) {
      console.error(error);
    }
  };

  initializeChat();
}, []);

useEffect(() => {
  // Load saved messages when opening the page
  const savedMessages =
    localStorage.getItem("chatMessages");

  if (savedMessages) {
    setFormData((prev) => ({
      ...prev,
      messages: JSON.parse(savedMessages),
    }));
  }
 

     const userId = Cookies.get("userId");
    if (userId) {
       fetch(
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
      setFormData((prev) => ({
      ...prev,
      activechat: true,
    }));
  }
  const stompClient = new Client({
    brokerURL: "ws://localhost:7000/ws",
    reconnectDelay: 5000,
    onConnect: () => {

      setConnected(true);

      stompClient.subscribe(
        `/topic/chat/${Number(formData.chatroomnumber)}`,
        (message) => {
          const receivedMessage: ChatMessage =
            JSON.parse(message.body);

          // Ignore LEAVE messages
          if (
            receivedMessage.type === "LEAVE"
          ) {
            return;
          }

          setFormData((prev) => {

            // Prevent duplicates
            const alreadyExists =
              prev.messages.some(
                (msg) =>
                  msg.sender ===
                    receivedMessage.sender &&
                  msg.content ===
                    receivedMessage.content &&
                  msg.type ===
                    receivedMessage.type
              );

            if (alreadyExists) {
              return prev;
            }

            const updatedMessages = [
              ...prev.messages,
              receivedMessage,
            ];

            // Save messages
            localStorage.setItem(
              "chatMessages",
              JSON.stringify(updatedMessages)
            );

            return {
              ...prev,
              messages: updatedMessages,
            };
          });
        }
      );
    },

    onStompError: (frame) => {
      console.error(
        "STOMP Error:",
        frame.headers["message"]
      );
    },

    onWebSocketError: (error) => {
      console.error(
        "WebSocket Error:",
        error
      );
    },
  });

  stompClient.activate();
  setClient(stompClient);

  return () => {

    stompClient.deactivate();
  };
}, []);

  useEffect(() => {
    if (
      sender &&
      connected &&
      client &&
      !isJoined
    ) {
      client.publish({
        destination:
          `/app/chat.addUser/${Number(formData.chatroomnumber)}`,
        body: JSON.stringify({
          sender,
          type: "JOIN",
        }),
      });

      setIsJoined(true);
    }
  }, [
    sender,
    connected,
    client,
    isJoined,
  ]);

  const sendMessage = () => {


    if (
      occupied ||
      !client ||
      !content.trim()
    )
      return;

    client.publish({
      destination:
        `/app/chat.sendMessage/${Number(formData.chatroomnumber)}`,
      body: JSON.stringify({
        sender,
        content,
        type: "CHAT",
      }),
    });

    setContent("");
  };

const finishChat = async () => {
  try {
    const userId = Cookies.get("userId");
      const role = Cookies.get("userrole");
      const token = Cookies.get("token")
      if(role === "USER"){
        await fetch(
          `https://fitness-backend-15563671567.europe-west8.run.app/chatroom/updatechatroom/${formData.chatroom_id_number}`,
          {
          method: "PUT",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
          coach_id: Number(formData.chatroomnumber),
          user_id: null,
        }),
        }
      );
       
      }
    if (userId) {
      await fetch(
        "https://fitness-backend-15563671567.europe-west8.run.app/removepeople",
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
    }

    if (client) {
      client.publish({
        destination: `/app/chat.clear/${Number(formData.chatroomnumber)}`,
        body: JSON.stringify({
          sender,
          type: "LEAVE",
        }),
      });

      client.deactivate();
    }

    localStorage.removeItem(
      "chatMessages"
    );

    setFormData((prev) => ({
      ...prev,
      messages: [],
      activechat: false,
    }));
    setConnected(false);
    navigate("/");
  } catch (error) {
    console.error(error);
  }
};

return (
  <div>
    {/* {formData.displaywaitlist === false && countpeople > 2 ? <Waiting_list /> :  */}
      <div
      style={{
        maxWidth: "800px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
      }}
    >
      <h2>Chat Room - {sender}</h2>

      <div
        style={{
        
          height: "450px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {formData.messages.length ===
        0 ? (
          <p>No messages yet...</p>
        ) : (
          
          formData.messages.filter((x)=> x.type === "CHAT").map(
            (msg, index) => (
              <div
                key={index}
                style={{
                  textAlign:
                    msg.sender ===
                    sender
                      ? "right"
                      : "left",
                  marginBottom:
                    "10px",
                }}
              >
                <div
                  style={{
                    display:
                    displaychat,
                    padding: "10px",
                    borderRadius:
                      "10px",
                    maxWidth:
                      "70%",
                    backgroundColor:
                      msg.sender ===
                      sender
                        ? "#4CAF50"
                        : "#E5E5EA",
                    color:
                      msg.sender ===
                      sender
                        ? "#fff"
                        : "#000",
                  }}
                >
                  <strong>
                    {msg.sender}
                  </strong>

                  <br />

                  {msg.type ===
                  "JOIN" 
                    ? `${msg.sender} joined the chat`
                    : msg.type ===
                      "LEAVE"
                    ? `${msg.sender} left the chat`
                    : msg.content}
                </div>
              </div>
            )
          )
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={content}
          onChange={(e) =>
            setContent(
              e.target.value
            )
          }
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px",
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding:
              "10px 20px",
          }}
        >
          Send
        </button>

        <button
          onClick={finishChat}
        >
          Finish Chat
        </button>
      </div>
    </div>
    </div>
  );
  // }else{
  //   return(
  //     <div>
  //       {formData.displaywaitlist === true ? <Waiting_list /> : ""}
  
  //     </div>
  //   )
  // }

};

export default ChatBox;