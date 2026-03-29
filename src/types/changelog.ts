export type ChangelogCategory = "new" | "improvement" | "fix";

export interface ChangelogItem {
  category: ChangelogCategory;
  title: string;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  entries: ChangelogItem[];
}
