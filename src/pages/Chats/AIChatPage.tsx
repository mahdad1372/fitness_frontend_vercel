import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";

interface ChatMessage {
  sender: string;
  content: string;
  isAI: boolean;
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "AI Coach",
      content: "Hi! I'm your AI fitness coach. While you wait for your coach to become available, feel free to ask me anything about fitness, nutrition, or workouts! 💪",
      isAI: true,
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      sender: "You",
      content: input.trim(),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const messageToSend = input.trim();
    setInput("");

    try {
      const token = Cookies.get("token");
      const userId = Cookies.get("userId");

      const response = await fetch("http://localhost:7000/api/ai-chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
          message: messageToSend,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "AI Coach",
          content: data.reply,
          isAI: true,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI Coach",
          content: "Sorry, I couldn't respond. Please try again.",
          isAI: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="rounded-2xl border border-blue-200 bg-white dark:border-blue-800 dark:bg-white/[0.03] overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h2 className="text-white font-semibold">AI Fitness Coach</h2>
            <p className="text-blue-200 text-xs">Available while you wait for your coach</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-white/[0.02]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.isAI
                    ? "bg-white dark:bg-white/[0.08] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/10 rounded-tl-none"
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}
              >
                {msg.isAI && (
                  <p className="text-xs font-semibold text-blue-500 mb-1">AI Coach</p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-white/[0.08] border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-white/10 flex gap-2 bg-white dark:bg-white/[0.03]">
          <input
            type="text"
            placeholder="Ask your AI coach anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] px-4 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIChatPage;