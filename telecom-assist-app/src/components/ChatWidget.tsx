import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from "lucide-react";
import { courriersApi } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

export function ChatWidget({ page }: { page?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis l'assistant SmartMail. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { result } = await courriersApi.iaChat(text, { page });
      setMessages(prev => [...prev, { role: "assistant", content: result || "Je n'ai pas pu traiter votre demande." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Service temporairement indisponible." }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 rounded-xl border bg-card shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-ai" />
              Assistant SmartMail
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-accent text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 h-80 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {m.role === "assistant" && <Bot className="h-3.5 w-3.5 inline mr-1 opacity-60" />}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-muted px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Réflexion...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Posez votre question…"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="rounded-md bg-primary text-primary-foreground px-3 py-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
