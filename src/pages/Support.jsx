const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Loader2, MessageCircle, History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function Support() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lang, setLang] = useState("ar"); // "en" | "ar" (Saudi Khaleeji)
  const bottomRef = useRef(null);
  const alertedRef = useRef(false); // one summary per conversation
  const [summaryLoader, setSummaryLoader] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openChat, setOpenChat] = useState(null); // id of expanded past chat

  const langDirective =
    lang === "en"
      ? "[LANG=en] Reply to the customer only in English from now on.\n\n"
      : "[LANG=ar] رد على العميل باللهجة السعودية (الخليجية) فقط من الآن فصاعداً.\n\n";

  const stripDirective = (content) =>
    (content || "").replace(/^\[LANG=(en|ar)\][^\n]*\n\n/s, "");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const me = await db.auth.me();
      if (!me?.email) return;
      setLoadingHistory(true);
      const rows = await db.entities.SupportConversation.filter(
        { customer_email: me.email },
        "-ended_at",
        50
      );
      setHistory(rows || []);
      setLoadingHistory(false);
    } catch {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadHistory();
      } catch {}
    })();
    // eslint-disable-next-line
  }, []);

  const startChat = async () => {
    const isAuth = await db.auth.isAuthenticated();
    if (!isAuth) {
      db.auth.redirectToLogin(window.location.href);
      return;
    }
    setStarting(true);
    const conv = await db.agents.createConversation({
      agent_name: "support_bot",
      metadata: { name: "Support Chat" },
    });
    setConversation(conv);
    db.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });
    setStarting(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversation) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    await db.agents.addMessage(conversation, { role: "user", content: langDirective + text });
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = async () => {
    if (summaryLoader) return;
    const transcript = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${stripDirective(m.content)}`)
      .join("\n")
      .trim();
    if (!transcript) {
      reset();
      return;
    }
    setSummaryLoader(true);
    try {
      const me = await db.auth.me().catch(() => ({}));
      const who = me?.full_name || me?.email || "A customer";
      const res = await db.integrations.Core.InvokeLLM({
        prompt:
          "Here is the full transcript of a customer support chat:\n\"\"\"\n" +
          transcript +
          "\n\"\"\"\n\nWrite a short overall summary of the chat, and a one-line statement of the customer's main problem/issue. Be concise.",
        response_json_schema: {
          type: "object",
          properties: { summary: { type: "string" }, problem: { type: "string" } },
          required: ["summary", "problem"],
        },
      });
      const message =
        `💬 Support chat ended — ${who}\n` +
        `Summary: ${res?.summary || "—"}\n` +
        `Problem: ${res?.problem || "—"}`;
      await db.entities.Notification.create({ message, type: "general" });
      try {
        await db.entities.SupportConversation.create({
          customer_email: me?.email || "",
          customer_name: who,
          summary: res?.summary || "",
          problem: res?.problem || "",
          transcript,
          ended_at: new Date().toISOString(),
        });
      } catch {}
      toast.success(lang === "en" ? "Chat ended. Thank you!" : "انتهت المحادثة. شكراً لك!");
      reset();
      loadHistory();
    } catch {
      toast.error(lang === "en" ? "Could not end chat. Try again." : "تعذّر إنهاء المحادثة. حاول مرة أخرى.");
    }
    setSummaryLoader(false);
  };

  const reset = () => {
    setConversation(null);
    setMessages([]);
    setInput("");
    alertedRef.current = false;
  };

  const deleteHistory = async (id) => {
    try {
      await db.entities.SupportConversation.delete(id);
      setHistory((h) => h.filter((r) => r.id !== id));
      if (openChat === id) setOpenChat(null);
      toast.success(lang === "en" ? "Chat deleted" : "تم حذف المحادثة");
    } catch {
      toast.error(lang === "en" ? "Could not delete" : "تعذّر الحذف");
    }
  };

  if (!conversation) {
    const fmtDate = (iso) => {
      try {
        return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "ar-SA", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return iso;
      }
    };
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm mx-auto mb-10"
        >
          <div className="w-20 h-20 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Customer Support</h1>
          <p className="text-stone-500 mb-8 text-sm leading-relaxed">
            {lang === "en"
              ? "Have an issue, question, or feedback? Chat with our support bot and we'll get back to you."
              : "عندك مشكلة، سؤال، أو ملاحظة؟ تكلم مع بوت الدعم وبرد عليك."}
          </p>
          <Button
            onClick={startChat}
            disabled={starting}
            className="bg-stone-900 hover:bg-stone-800 rounded-xl px-8 h-12"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            {lang === "en" ? "Start Chat" : "ابدأ المحادثة"}
          </Button>
        </motion.div>

        {/* Previous chats */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-stone-700 mb-3">
            <History className="w-4 h-4" />
            <h2 className="text-sm font-semibold">
              {lang === "en" ? "Previous chats" : "المحادثات السابقة"}
            </h2>
          </div>
          {loadingHistory ? (
            <div className="text-stone-400 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {lang === "en" ? "Loading…" : "جارٍ التحميل…"}
            </div>
          ) : history.length === 0 ? (
            <p className="text-stone-400 text-sm">
              {lang === "en" ? "No previous chats yet." : "لا توجد محادثات سابقة بعد."}
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((chat) => (
                <div key={chat.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenChat(openChat === chat.id ? null : chat.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-stone-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {chat.summary ? (
                          lang === "en" ? chat.summary : chat.summary
                        ) : lang === "en" ? "Support chat" : "محادثة دعم"}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{fmtDate(chat.ended_at)}</p>
                      {chat.problem && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                          {lang === "en" ? "Issue: " : "المشكلة: "}
                          {chat.problem}
                        </p>
                      )}
                    </div>
                    {openChat === chat.id ? (
                      <ChevronUp className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                    )}
                  </button>
                  {openChat === chat.id && (
                    <div className="border-t border-stone-100 px-4 py-3">
                      <pre className="whitespace-pre-wrap text-xs text-stone-600 font-sans leading-relaxed max-h-96 overflow-y-auto">
                        {chat.transcript}
                      </pre>
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHistory(chat.id)}
                          className="text-red-600 hover:bg-red-50 rounded-lg h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          {lang === "en" ? "Delete" : "حذف"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const visibleMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-stone-900 text-sm">Support Assistant</p>
          <p className="text-xs text-emerald-500 font-medium">● Online</p>
        </div>
        <div className="flex items-center rounded-xl border border-stone-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={`px-3 h-9 text-sm font-medium transition-colors ${
              lang === "ar" ? "bg-stone-900 text-white" : "bg-white text-stone-500 hover:text-stone-800"
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 h-9 text-sm font-medium transition-colors ${
              lang === "en" ? "bg-stone-900 text-white" : "bg-white text-stone-500 hover:text-stone-800"
            }`}
          >
            English
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={endChat}
          disabled={summaryLoader || messages.length === 0}
          className="rounded-xl h-9"
        >
          {summaryLoader ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {lang === "en" ? "End chat" : "إنهاء"}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-stone-900 text-white rounded-br-sm"
                    : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-sm prose-stone max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{stripDirective(msg.content)}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-stone-100 px-4 py-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={lang === "en" ? "Type your message..." : "اكتب رسالتك..."}
            className="rounded-xl flex-1 h-11"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-stone-900 hover:bg-stone-800 rounded-xl h-11 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}