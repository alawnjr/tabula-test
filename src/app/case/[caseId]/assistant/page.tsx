"use client";

import { use } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function AssistantPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--rule-soft)] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-deep)] text-white">
            <svg
              width="14"
              height="14"
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
          <div>
            <h1 className="text-[15px] font-medium text-[var(--ink)]">
              Virtual Assistant
            </h1>
            <p className="text-[12px] text-[var(--mute)]">
              Tabula AI · Full case context loaded
            </p>
          </div>
          <span className="ml-auto pill">
            <span className="dot pulse" />
            AI-powered
          </span>
        </div>
      </div>

      {/* Chat takes up all remaining space */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface caseId={caseId} />
      </div>
    </div>
  );
}
