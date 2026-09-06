const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isThinking = message.role === "assistant" && !message.content && (!message.tool_calls || message.tool_calls.length === 0);

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {isThinking ? (
          <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            <span className="text-sm text-stone-400">Thinking...</span>
          </div>
        ) : (
          <>
            {message.tool_calls?.map((tc, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {tc.status === "completed" ? "✅" : tc.status === "running" || tc.status === "in_progress" ? "⏳" : "🔄"}{" "}
                  {tc.name?.split(".").reverse().join(" ").toLowerCase()}
                </span>
              </div>
            ))}
            {message.content && (
              <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-stone-900 text-white" : "bg-white border border-stone-100"}`}>
                {isUser ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm prose-stone max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StoreManager() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    db.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (isAdmin) initConversation();
  }, [isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    const conv = await db.agents.createConversation({
      agent_name: "store_manager",
      metadata: { name: "Store Manager Session" },
    });
    setConversation(conv);
    setMessages(conv.messages || []);

    db.agents.subscribeToConversation(conv.id, (data) => {
      setMessages([...data.messages]);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await db.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">Access denied.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center gap-4">
        <Link to={createPageUrl("AdminOrders")} className="text-stone-400 hover:text-stone-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-stone-900">AI Store Manager</h1>
          <p className="text-xs text-stone-400">Tell me anything — I'll handle it</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl w-full mx-auto space-y-4">
        {messages.length === 0 && !conversation && (
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
          </div>
        )}
        {messages.length === 0 && conversation && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">AI Store Manager</h2>
            <p className="text-stone-500 mb-6">I have full control over your store — products, orders, promos, points, rewards, and more. Try:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
              {[
                "Show me all pending orders",
                "Mark all pending orders as confirmed",
                "Delete all products with 0 stock",
                "Give customer X@gmail.com 500 bonus points",
                "Create promo FLASH20 for 20% off",
                "Add a product called Lays Original at 15 EGP",
                "List all delivered orders",
                "Create a Free Delivery reward for 2000 points",
                "Deactivate all products in the chips category",
                "Show me all promo codes",
                "Update Chipsy Tomato price to 12 EGP",
                "Create a new category called Drinks",
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="text-left text-sm bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-400 hover:bg-stone-50 transition-all text-stone-700"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-stone-100 px-4 py-4">
        <div className="max-w-5xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to do in the store..."
            className="rounded-xl flex-1"
            disabled={sending || !conversation}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending || !conversation}
            className="bg-stone-900 hover:bg-stone-800 rounded-xl px-4"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}