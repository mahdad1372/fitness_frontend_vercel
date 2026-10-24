import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "./typings";

// Connect to Socket.IO server
const socket: io.Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:9093"
);

function App() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [isConnected, setIsConnected] = useState(false); // track connection status

  // Handle sending messages
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg || !room) return;
    socket.emit("clientMsg", { msg, room });
    setMsg("");
    setRoom("");
  };

  useEffect(() => {
    // Listen for connection events
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server with id:", socket.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    // Listen for server messages
    socket.on("serverMsg", (data) => {
      setMessages((prev) => [...prev, data.msg]);
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("serverMsg");
    };
  }, []);

  return (
    <div className="App">
      <div>
        <h1>Messages</h1>
        <p>
          Connection status:{" "}
          <strong style={{ color: isConnected ? "green" : "red" }}>
            {isConnected ? "Connected" : "Disconnected"}
          </strong>
        </p>
        {messages.map((msg, i) => (
          <p key={i} className="msg">
            {msg}
          </p>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="user-interface">
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          type="text"
          placeholder="Enter Room Key"
        />
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          type="text"
          placeholder="Enter message"
        />
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}

export default App;
