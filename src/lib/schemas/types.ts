export type FieldType =
  | "text"
  | "textarea"
  | "currency"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "address";

export type Option = { value: string; label: string };

export type Field = {
  kind?: "field";
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  visibleIf?: { fieldId: string; equals: string | number | boolean };
};

export type RepeatingGroup = {
  kind: "repeating-group";
  id: string;
  label: string;
  itemLabel: string;
  description?: string;
  minItems?: number;
  fields: Field[];
};

export type SectionItem = Field | RepeatingGroup;

export type Section = {
  id: string;
  title: string;
  description?: string;
  items: SectionItem[];
};

export type ChapterId = "chapter7" | "chapter13" | "meansTest";

export type FormSchema = {
  id: string;
  title: string;
  longTitle: string;
  appliesTo: ChapterId[];
  derived?: boolean;
  sections: Section[];
};

export function isRepeatingGroup(item: SectionItem): item is RepeatingGroup {
  return (item as RepeatingGroup).kind === "repeating-group";
}
