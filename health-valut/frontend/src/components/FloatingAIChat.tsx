import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  FileText,
  Pill,
  Trash2,
  Bot,
  User as UserIcon,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Spinner } from "./UI";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

type Mode = "chat" | "explain" | "analyze";

const SUGGESTIONS = [
  "Explain normal blood pressure ranges",
  "I have a mild fever, what are safe first-aid steps?",
  "What questions should I ask during a doctor visit?",
  "How to interpret CBC blood test numbers?",
];

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [demoMode, setDemoMode] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  // Tool state
  const [toolText, setToolText] = useState("");
  const [toolResult, setToolResult] = useState("");
  const [toolLoading, setToolLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/ai/status")
      .then((res) => setDemoMode(res.data.demoMode))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && mode === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, mode]);

  async function handleSend(customText?: string) {
    const text = (customText || input).trim();
    if (!text || sending) return;

    const userMsg: ChatMsg = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/ai/assistant", { message: text, conversationId });
      setConversationId(res.data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue reaching the assistant. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSend();
  }

  async function handleToolSubmit(e: FormEvent) {
    e.preventDefault();
    if (!toolText.trim() || toolLoading) return;
    setToolLoading(true);
    setToolResult("");

    try {
      if (mode === "explain") {
        const res = await api.post("/ai/explain-report", { reportText: toolText });
        setToolResult(res.data.explanation);
      } else if (mode === "analyze") {
        const res = await api.post("/ai/analyze-prescription", { prescriptionText: toolText });
        setToolResult(res.data.analysis);
      }
    } catch {
      setToolResult("An error occurred while processing the request. Please try again.");
    } finally {
      setToolLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setConversationId(undefined);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expanded Floating Modal Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-vault-line flex flex-col overflow-hidden mb-3.5 transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-vault-primary text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-semibold text-sm">Health Valut AI</h3>
                  {demoMode && (
                    <span className="text-[10px] bg-amber-400/20 text-amber-200 font-mono px-1.5 py-0.2 rounded">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/75">Assistive Health Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/patient/ai-assistant"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title="Open full page assistant"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              {mode === "chat" && messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-vault-line bg-vault-bg/60 p-1 text-xs">
            <button
              onClick={() => setMode("chat")}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                mode === "chat"
                  ? "bg-white text-vault-primary shadow-xs"
                  : "text-vault-muted hover:text-vault-ink"
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Chat
            </button>
            <button
              onClick={() => {
                setMode("explain");
                setToolResult("");
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                mode === "explain"
                  ? "bg-white text-vault-primary shadow-xs"
                  : "text-vault-muted hover:text-vault-ink"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Explain Lab
            </button>
            <button
              onClick={() => {
                setMode("analyze");
                setToolResult("");
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                mode === "analyze"
                  ? "bg-white text-vault-primary shadow-xs"
                  : "text-vault-muted hover:text-vault-ink"
              }`}
            >
              <Pill className="w-3.5 h-3.5" /> Rx Helper
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col bg-slate-50/40">
            {mode === "chat" ? (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                {messages.length === 0 ? (
                  <div className="my-auto text-center py-4 px-2 space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-vault-primaryLight flex items-center justify-center text-vault-primary mx-auto">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-vault-ink">How can I assist your health today?</p>
                      <p className="text-xs text-vault-muted mt-1 max-w-[260px] mx-auto">
                        Ask health questions, clarify medical terms, or request first-aid guidance.
                      </p>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="pt-2 flex flex-col gap-1.5 text-left">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-vault-muted font-semibold">
                        Suggested questions:
                      </p>
                      {SUGGESTIONS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="text-left text-xs p-2 rounded-xl border border-vault-line bg-white hover:border-vault-primary hover:bg-vault-primaryLight/50 text-vault-ink transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-vault-primary flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                            m.role === "user"
                              ? "bg-vault-primary text-white rounded-tr-none"
                              : "bg-white text-vault-ink border border-vault-line rounded-tl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-2 justify-start items-center">
                        <div className="w-6 h-6 rounded-full bg-vault-primary flex items-center justify-center text-white text-[10px] shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-white border border-vault-line rounded-2xl rounded-tl-none px-3 py-2">
                          <Spinner className="w-3.5 h-3.5 text-vault-primary" />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            ) : (
              /* Tool Mode: Explain Report or Analyze Prescription */
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto">
                <form onSubmit={handleToolSubmit} className="space-y-2">
                  <label className="text-xs font-semibold text-vault-ink">
                    {mode === "explain" ? "Paste Medical Report Text:" : "Paste Prescription Text:"}
                  </label>
                  <textarea
                    rows={4}
                    className="input text-xs"
                    value={toolText}
                    onChange={(e) => setToolText(e.target.value)}
                    placeholder={
                      mode === "explain"
                        ? "e.g. Hemoglobin: 11.2 g/dL (Ref: 12.0 - 15.5), WBC: 7,400 /mcL..."
                        : "e.g. Tab Metformin 500mg - 1 tab after breakfast & dinner for 30 days..."
                    }
                  />
                  <button
                    type="submit"
                    disabled={toolLoading || !toolText.trim()}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    {toolLoading ? (
                      <>
                        <Spinner className="w-3.5 h-3.5" /> Analyzing with AI...
                      </>
                    ) : mode === "explain" ? (
                      "Explain in Plain English"
                    ) : (
                      "Extract Structured Schedule"
                    )}
                  </button>
                </form>

                {toolResult && (
                  <div className="p-3 rounded-xl bg-white border border-vault-line shadow-xs space-y-1">
                    <p className="text-[11px] font-mono text-vault-primary font-semibold uppercase">
                      AI Analysis Result:
                    </p>
                    <p className="text-xs whitespace-pre-wrap text-vault-ink leading-relaxed">
                      {toolResult}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Bar (for Chat Mode) */}
          {mode === "chat" && (
            <form onSubmit={handleFormSubmit} className="p-2.5 bg-white border-t border-vault-line flex gap-2 items-center">
              <input
                className="input text-xs py-2 flex-1"
                placeholder="Ask Health AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-primary px-3 py-2 text-xs flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-vault-primary hover:bg-vault-primaryDark text-white rounded-full shadow-2xl transition-all duration-200 hover:scale-105"
        aria-label="Open Health AI Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <Sparkles className="w-5 h-5 text-emerald-200" />
        <span className="text-sm font-semibold pr-1">Health AI</span>
      </button>
    </div>
  );
}
