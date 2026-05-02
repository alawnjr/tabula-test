"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCaseStore } from "@/state/case-store";
import { formatCurrency } from "@/lib/currency";
import { caseSummary } from "@/lib/derived";

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

export function SummaryView() {
  const record = useCaseStore((s) =>
    s.activeCaseId ? s.cases[s.activeCaseId] : null
  );
  if (!record) return null;
  const s = caseSummary(record);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Assets (Schedule A/B)</CardTitle>
          <CardDescription>Current value of property you own.</CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Real estate" value={s.assets.realEstate} />
          <Row label="Vehicles" value={s.assets.vehicles} />
          <Row label="Personal & household" value={s.assets.personal} />
          <Row label="Financial" value={s.assets.financial} />
          <Row label="Business-related" value={s.assets.business} />
          <Row label="Farm / fishing" value={s.assets.farm} />
          <Row label="Other property" value={s.assets.other} />
          <Separator className="my-2" />
          <Row label="Total assets" value={s.assets.grand} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liabilities (Schedules D + E/F)</CardTitle>
          <CardDescription>What you owe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Secured claims" value={s.liabilities.secured} />
          <Row label="Priority unsecured" value={s.liabilities.priority} />
          <Row label="Nonpriority unsecured" value={s.liabilities.nonpriority} />
          <Separator className="my-2" />
          <Row label="Total liabilities" value={s.liabilities.grand} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly cash flow</CardTitle>
          <CardDescription>Schedule I − Schedule J.</CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Debtor 1 take-home" value={s.income.d1Net} />
          <Row label="Debtor 2 take-home" value={s.income.d2Net} />
          <Row
            label="Other income"
            value={s.income.otherD1 + s.income.otherD2}
          />
          <Separator className="my-2" />
          <Row label="Combined monthly income" value={s.income.combined} />
          <Row label="Monthly expenses" value={s.expenses} />
          <Separator className="my-2" />
          <Row label="Monthly net income" value={s.net} />
        </CardContent>
      </Card>
    </div>
  );
}
