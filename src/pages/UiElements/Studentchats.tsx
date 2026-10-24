import React, { useEffect, useState, useRef, KeyboardEvent } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  sender: string;
  content: string;
}

// Single ChatPanel component that can be reused for Coach or Student
interface ChatPanelProps {
  senderLabel: string;
  color: string;
  messages: Message[];
  sendMessage: (msg: string, sender: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ senderLabel, color, messages, sendMessage }) => {
  const [input, setInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, senderLabel);
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ flex: 1, margin: "0 10px", fontFamily: "Arial, sans-serif" }}>
      <h3>{senderLabel} Chat</h3>
      <div
        style={{
          border: "1px solid black",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              color:
                msg.sender === senderLabel
                  ? color
                  : msg.sender === "System"
                  ? "gray"
                  : msg.sender === "Coach"
                  ? "blue"
                  : "green",
              marginBottom: "5px",
            }}
          >
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          style={{ flex: 1, padding: "5px" }}
        />
        <button
          onClick={handleSend}
          style={{ padding: "5px 10px", marginLeft: "5px", cursor: "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect to Socket.IO server
  useEffect(() => {
    socketRef.current = io("http://localhost:9093", { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      console.log("Connected, socket id:", socketRef.current?.id);
    });

    socketRef.current.on("message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = (content: string, sender: string) => {
    const message: Message = { sender, content };
    socketRef.current?.emit("message", message);
    setMessages((prev) => [...prev, message]); // update locally immediately
  };

  return (
    <div style={{ display: "flex", maxWidth: "1100px", margin: "20px auto" }}>
      <ChatPanel senderLabel="Coach" color="blue" messages={messages} sendMessage={sendMessage} />
      <ChatPanel senderLabel="Student" color="green" messages={messages} sendMessage={sendMessage} />
    </div>
  );
};

export default ChatPage;
