"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const INITIAL: Message[] = [
  {
    role: "assistant",
    content:
      "I can see this extraction grid. Ask me for key insights — summaries across documents, outliers, missing values, or anything you want pulled together.",
  },
];

// Side-panel chat that reasons over the current review grid. `buildContext`
// is called fresh on every send so the assistant always sees the latest
// extracted values.
export function TableChat({ buildContext }: { buildContext: () => string }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text } as Message];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          caseContext: buildContext(),
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          copy[copy.length - 1] = {
            ...last,
            content: "Something went wrong. Please try again.",
          };
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, buildContext]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--rule-soft)] px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-deep)] text-white">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L9.5 5.5L14 5.5L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5L6.5 5.5L8 1Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-tight text-[var(--ink)]">
            Key insights
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Reads the grid live
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                msg.role === "user"
                  ? "bg-[var(--accent-deep)] text-white"
                  : "border border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--ink)]"
              )}
            >
              {msg.content === "" && loading && i === messages.length - 1 ? (
                <span className="inline-flex items-center gap-1 text-[var(--mute)]">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse [animation-delay:0.2s]">●</span>
                  <span className="animate-pulse [animation-delay:0.4s]">●</span>
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-[var(--rule-soft)] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask for insights across the grid…"
            rows={1}
            className={cn(
              "max-h-32 flex-1 resize-none overflow-y-auto rounded-lg border border-[var(--rule-soft)] bg-[var(--paper)] px-3 py-2",
              "text-[13px] leading-relaxed text-[var(--ink)] placeholder:text-[var(--mute)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--accent-deep)]"
            )}
            style={{ minHeight: "36px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-deep)] text-white transition-colors",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            )}
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--mute)]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
