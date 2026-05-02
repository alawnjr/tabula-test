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
}: {
  section: Section;
  formId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        {section.description ? (
          <CardDescription>{section.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
