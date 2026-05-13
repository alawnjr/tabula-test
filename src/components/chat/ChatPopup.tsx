"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatInterface } from "./ChatInterface";
import { cn } from "@/lib/utils";

export function ChatPopup({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide popup entirely when on the virtual assistant page
  if (pathname === `/case/${caseId}/assistant`) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Expanded chat panel */}
      {open && (
        <div
          className={cn(
            "w-[360px] rounded-2xl border border-[var(--rule-soft)] bg-[var(--paper)] shadow-2xl",
            "flex flex-col overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-4 duration-200"
          )}
          style={{ height: "480px" }}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3">
            <div className="flex items-center gap-2">
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
              <span className="text-[13px] font-medium text-[var(--ink)]">
                Tabula AI
              </span>
              <span className="pill py-[2px] text-[10px]">
                <span className="dot pulse" />
                Case context loaded
              </span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`/case/${caseId}/assistant`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--mute)] transition-colors hover:bg-[var(--field-bg)] hover:text-[var(--ink)]"
                title="Open full assistant"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 13L13 3M13 3H7M13 3V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--mute)] transition-colors hover:bg-[var(--field-bg)] hover:text-[var(--ink)]"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 3L13 13M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <ChatInterface caseId={caseId} compact />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-[var(--accent-deep)] text-white",
          "hover:scale-105 hover:shadow-xl",
          open && "rotate-90"
        )}
        title={open ? "Close assistant" : "Open Tabula AI"}
      >
        {open ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 10h8M8 14h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
