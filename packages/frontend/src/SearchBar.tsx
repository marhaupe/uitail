import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";

// Define necessary types and enums
export enum FieldKey {
  ASSIGNED = "assigned",
  BROWSER_NAME = "browser.name",
  IS = "is",
  LAST_SEEN = "lastSeen",
  TIMES_SEEN = "timesSeen",
  // Add other field keys as needed
}

export enum FieldKind {
  FIELD = "field",
  // Add other field kinds as needed
}

export enum FieldValueType {
  BOOLEAN = "boolean",
  STRING = "string",
  NUMBER = "number",
  // Add other field value types as needed
}

export enum ItemType {
  TAG_VALUE = "tag_value",
  // Add other item types as needed
}

export interface TagValue {
  value: string;
}

export interface TagValueObject {
  title: string;
  type: ItemType;
  value: string;
  icon: string | null;
  documentation?: string;
  children: TagValue[];
}

export type TagValues = string[] | TagValueObject[];

export interface Tag {
  key: string;
  name: string;
  kind?: FieldKind;
  predefined?: boolean;
  values?: TagValues;
}

export type TagCollection = {
  [key: string]: Tag;
};

export interface FilterKeySection {
  value: string;
  label: string;
  children: string[];
}

type Props = {
  className?: string;
  initialQuery: string;
  filterKeys: TagCollection;
  getTagValues: (filterKey: string, query: string) => Promise<string[]>;
  searchSource: string;
  filterKeySections?: FilterKeySection[];
  fieldDefinitionGetter?: () => {
    desc: string;
    kind: FieldKind;
    valueType: FieldValueType;
  };
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  disabled?: boolean;
  disallowFreeText?: boolean;
  disallowLogicalOperators?: boolean;
  disallowWildcard?: boolean;
  disallowUnsupportedFilters?: boolean;
  invalidMessages?: {
    [key: string]: string;
  };
  recentSearches?: string[];
};

export function SearchQueryBuilder({
  className,
  initialQuery,
  onChange,
  onSearch,
  disabled = false,
}: //   filterKeys,
//   getTagValues,
//   searchSource,
//   filterKeySections,
//   fieldDefinitionGetter,
//   disallowFreeText = false,
//   disallowLogicalOperators = false,
//   disallowWildcard = false,
//   disallowUnsupportedFilters = false,
//   invalidMessages = {},
//   recentSearches,
Props) {
  return (
    <input
      placeholder="Search"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring  disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}
