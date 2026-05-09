"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isRepeatingGroup, type Section } from "@/lib/schemas/types";
import { FieldRenderer } from "./FieldRenderer";
import { RepeatingGroup } from "./RepeatingGroup";

export function SectionRenderer({
  section,
  formId,
  unwrapped = false,
}: {
  section: Section;
  formId: string;
  unwrapped?: boolean;
}) {
  const body = (
    <div className="space-y-4">
      {section.items.map((item) =>
        isRepeatingGroup(item) ? (
          <RepeatingGroup key={item.id} group={item} formId={formId} />
        ) : (
          <FieldRenderer
            key={item.id}
            field={item}
            formId={formId}
            parentPath={[]}
          />
        )
      )}
    </div>
  );

  if (unwrapped) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        {section.description ? (
          <CardDescription>{section.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
