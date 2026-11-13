import { describe, it, expect } from "vitest";
import {
  assertTransition,
  canEdit,
  isPublicArticle,
  requireAdmin,
  type Actor,
  type Status,
} from "@/modules/workflow/policy";
const journalist: Actor = { id: "author", role: "JOURNALIST", active: true };
const editor: Actor = { id: "editor", role: "EDITOR", active: true };
const admin: Actor = { id: "admin", role: "ADMIN", active: true };
const article = (status: Status) => ({ status, leadAuthorId: "author" });
describe("editorial authorization", () => {
  it("permits authors to submit their own drafts", () =>
    expect(() =>
      assertTransition(journalist, article("DRAFT"), "IN_REVIEW"),
    ).not.toThrow());
  it("prevents another journalist submitting", () =>
    expect(() =>
      assertTransition(
        { ...journalist, id: "other" },
        article("DRAFT"),
        "IN_REVIEW",
      ),
    ).toThrow());
  it.each(["APPROVED", "PUBLISHED", "SCHEDULED"] as Status[])(
    "does not let journalists move to %s",
    (next) => {
      const from = next === "APPROVED" ? "IN_REVIEW" : "APPROVED";
      expect(() =>
        assertTransition(
          journalist,
          article(from),
          next,
          "",
          new Date(Date.now() + 60000),
        ),
      ).toThrow();
    },
  );
  it("does not let an editor approve their own story", () =>
    expect(() =>
      assertTransition(
        { ...editor, id: "author" },
        article("IN_REVIEW"),
        "APPROVED",
      ),
    ).toThrow(/different editor/));
  it("also checks coauthors", () =>
    expect(() =>
      assertTransition(
        editor,
        { ...article("IN_REVIEW"), authorIds: ["editor"] },
        "APPROVED",
      ),
    ).toThrow());
  it("requires a reason for admin self-approval", () =>
    expect(() =>
      assertTransition(
        { ...admin, id: "author" },
        article("IN_REVIEW"),
        "APPROVED",
      ),
    ).toThrow());
  it("records an intentional admin override", () =>
    expect(() =>
      assertTransition(
        { ...admin, id: "author" },
        article("IN_REVIEW"),
        "APPROVED",
        "Emergency override",
      ),
    ).not.toThrow());
  it("requires a rejection reason", () =>
    expect(() =>
      assertTransition(editor, article("IN_REVIEW"), "DRAFT"),
    ).toThrow(/reason/));
  it("requires an unpublish reason", () =>
    expect(() =>
      assertTransition(editor, article("PUBLISHED"), "UNPUBLISHED"),
    ).toThrow(/reason/));
  it("rejects past publication dates", () =>
    expect(() =>
      assertTransition(
        editor,
        article("APPROVED"),
        "SCHEDULED",
        "",
        new Date(0),
      ),
    ).toThrow(/future/));
  it("rejects invalid publication dates", () =>
    expect(() =>
      assertTransition(
        editor,
        article("APPROVED"),
        "SCHEDULED",
        "",
        new Date("invalid"),
      ),
    ).toThrow());
  it("permits future schedules", () =>
    expect(() =>
      assertTransition(
        editor,
        article("APPROVED"),
        "SCHEDULED",
        "",
        new Date(Date.now() + 100000),
      ),
    ).not.toThrow());
  it.each([
    "PUBLISHED",
    "APPROVED",
    "SCHEDULED",
    "IN_REVIEW",
    "UNPUBLISHED",
  ] as Status[])("prevents silent edits in %s", (status) =>
    expect(canEdit(admin, article(status))).toBe(false),
  );
  it("prevents editing another author's draft", () =>
    expect(canEdit({ ...journalist, id: "other" }, article("DRAFT"))).toBe(
      false,
    ));
  it("allows editors to edit drafts", () =>
    expect(canEdit(editor, article("DRAFT"))).toBe(true));
  it("blocks inactive staff", () =>
    expect(() =>
      assertTransition(
        { ...admin, active: false },
        article("IN_REVIEW"),
        "APPROVED",
      ),
    ).toThrow(/inactive/));
  it("restricts staff management to admin", () =>
    expect(() => requireAdmin(editor)).toThrow());
  const states: Status[] = [
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "UNPUBLISHED",
  ];
  const valid = new Set([
    "DRAFT:IN_REVIEW",
    "IN_REVIEW:DRAFT",
    "IN_REVIEW:APPROVED",
    "APPROVED:PUBLISHED",
    "APPROVED:SCHEDULED",
    "SCHEDULED:DRAFT",
    "PUBLISHED:UNPUBLISHED",
    "UNPUBLISHED:DRAFT",
  ]);
  for (const from of states)
    for (const to of states)
      if (!valid.has(`${from}:${to}`))
        it(`rejects illegal transition ${from} → ${to}`, () =>
          expect(() =>
            assertTransition(
              admin,
              article(from),
              to,
              "reason",
              new Date(Date.now() + 60000),
            ),
          ).toThrow());
});
describe("public visibility", () => {
  it.each([
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "UNPUBLISHED",
  ] as Status[])("hides %s even with a published revision pointer", (status) =>
    expect(
      isPublicArticle({
        status,
        publishedAt: new Date(0),
        publishedRevisionId: "r",
      }),
    ).toBe(false),
  );
  it("hides a future-dated article", () =>
    expect(
      isPublicArticle({
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() + 60000),
        publishedRevisionId: "r",
      }),
    ).toBe(false));
  it("hides an article without an approved public revision", () =>
    expect(
      isPublicArticle({
        status: "PUBLISHED",
        publishedAt: new Date(0),
        publishedRevisionId: null,
      }),
    ).toBe(false));
  it("shows an actually published revision", () =>
    expect(
      isPublicArticle({
        status: "PUBLISHED",
        publishedAt: new Date(0),
        publishedRevisionId: "r",
      }),
    ).toBe(true));
});
