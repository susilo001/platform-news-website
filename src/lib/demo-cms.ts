import { demoStories } from "@/modules/articles/demo";
import type { Status } from "@/modules/workflow/policy";
const statuses: Status[] = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "SCHEDULED",
  "PUBLISHED",
  "APPROVED",
  "DRAFT",
  "PUBLISHED",
  "IN_REVIEW",
  "PUBLISHED",
  "PUBLISHED",
  "DRAFT",
];
export const demoArticles = demoStories.map((s, i) => ({
  ...s,
  status: statuses[i],
  currentRevision: { title: s.title },
  leadAuthor: { name: s.authors[0].name },
}));
export const demoCounts = demoArticles.reduce<Record<string, number>>(
  (a, s) => ({
    ...a,
    [s.status]: (a[s.status] ?? 0) + 1,
    total: (a.total ?? 0) + 1,
  }),
  {},
);
