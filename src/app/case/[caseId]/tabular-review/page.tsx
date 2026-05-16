"use client";

import { use, useCallback, useRef } from "react";
import { ReviewGrid } from "@/components/table-review/ReviewGrid";
import { TableChat } from "@/components/table-review/TableChat";
import {
  buildTableContext,
  EMPTY_TABLE,
  type ReviewTable,
} from "@/lib/review-table";

export default function TableReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const tableRef = useRef<ReviewTable>(EMPTY_TABLE);

  const onTableChange = useCallback((t: ReviewTable) => {
    tableRef.current = t;
  }, []);

  const buildContext = useCallback(
    () => buildTableContext(tableRef.current),
    []
  );

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1">
        <ReviewGrid caseId={caseId} onTableChange={onTableChange} />
      </div>
      <aside className="hidden w-[360px] shrink-0 border-l border-[var(--rule-soft)] xl:block">
        <TableChat buildContext={buildContext} />
      </aside>
    </div>
  );
}
