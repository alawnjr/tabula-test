"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCaseStore } from "@/state/case-store";
import { buildCaseContext } from "@/lib/chat-context";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const INITIAL: Message[] = [
  {
    role: "assistant",
    content:
      "Hi! I'm Tabula AI. I have access to this case's data and can answer questions about deadlines, next steps, legal concepts, or anything else you need help with.",
  },
];

export function ChatInterface({
  caseId,
  compact = false,
}: {
  caseId: string;
  compact?: boolean;
}) {
  const record = useCaseStore((s) => s.cases[caseId]);
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const caseContext = record ? buildCaseContext(record) : undefined;

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          caseContext,
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
  }, [input, loading, messages, record]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={cn("flex flex-col", compact ? "h-full" : "h-full")}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="mr-2 mt-1 shrink-0">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-deep)] text-white">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 1L9.5 5.5L14 5.5L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5L6.5 5.5L8 1Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            )}
            <div
              className={cn(
                "max-w-[82%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-[var(--accent-deep)] text-white"
                  : "bg-[var(--field-bg)] text-[var(--ink)] border border-[var(--rule-soft)]"
              )}
            >
              {msg.content === "" && loading && i === messages.length - 1 ? (
                <span className="inline-flex gap-1 items-center text-[var(--mute)]">
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

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--rule-soft)] p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about this case…"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-[var(--rule-soft)] bg-[var(--field-bg)] px-3 py-2",
              "text-[13px] leading-relaxed text-[var(--ink)] placeholder:text-[var(--mute)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--accent-deep)]",
              "max-h-32 overflow-y-auto"
            )}
            style={{
              height: "auto",
              minHeight: "36px",
            }}
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
              "shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "bg-[var(--accent-deep)] text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:opacity-90"
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8L14 2L8 14L7 9L2 8Z"
                fill="currentColor"
              />
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
