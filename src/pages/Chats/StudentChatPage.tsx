import React, { useEffect, useState, useRef } from "react";

interface ChatMessage {
  sender: string;
  content: string;
}

const StudentChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/chat");
    wsRef.current = ws;

    ws.onopen = () => console.log("Connected to WebSocket server");
    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };
    ws.onclose = () => console.log("WebSocket connection closed");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!input.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const message: ChatMessage = {
      sender: "Student",
      content: input.trim(),
    };

    wsRef.current.send(JSON.stringify(message));
    setInput("");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>Student Chat</h1>
      <div
        style={{
          border: "1px solid black",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ color: msg.sender === "Student" ? "green" : "blue" }}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <input
        type="text"
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "70%", padding: "5px" }}
      />
      <button onClick={sendMessage} style={{ padding: "5px 10px", marginLeft: "5px" }}>
        Send
      </button>
    </div>
  );
};

export default StudentChatPage;
