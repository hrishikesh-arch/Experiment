"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderType: string;
  messageText: string;
  timestamp: string;
};

export default function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [participantName, setParticipantName] = useState("You");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem("sessionId");
    if (!storedSession || storedSession !== sessionId) {
      router.push("/");
      return;
    }
    
    setParticipantName(localStorage.getItem("participantName") || "You");

    // Fetch messages periodically (Polling for Serverless compatibility)
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    
    // Fetch immediately
    fetchMessages();

    // Poll every 1.5 seconds
    const interval = setInterval(fetchMessages, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgText = inputText.trim();
    setInputText("");

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          senderType: "PARTICIPANT",
          messageText: msgText,
        }),
      });
      // The polling will pick up the new message
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5]">
      {/* Header */}
      <div className="bg-[#075e54] text-white p-4 flex items-center shadow-md">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 text-black font-bold">
          DC
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">Study Discussion Group</h1>
          <p className="text-xs opacity-80">Active now</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => {
          const isMe = msg.senderType === "PARTICIPANT";
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 text-sm font-bold text-blue-700">
                  {msg.senderName.charAt(0)}
                </div>
              )}
              <div 
                className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                  isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}
              >
                {!isMe && <div className="text-xs font-bold text-blue-500 mb-1">{msg.senderName}</div>}
                <div className="text-sm text-gray-800 break-words">{msg.messageText}</div>
                <div className="text-[10px] text-right text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f0f0] p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-full px-4 py-2 focus:outline-none border-none shadow-sm text-black"
            placeholder="Type a message"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="bg-[#075e54] text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
