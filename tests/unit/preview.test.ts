import { beforeEach, it, expect } from "vitest";
import { signPreview, verifyPreview } from "@/lib/preview";
beforeEach(() => {
  process.env.PREVIEW_SECRET = "unit-test-only-preview-key-32-characters";
});
const p = {
  articleId: "a",
  revisionId: "r",
  actorId: "u",
  expires: Date.now() + 60000,
};
it("verifies an authentic unexpired token", () =>
  expect(verifyPreview(signPreview(p))).toEqual(p));
it("rejects tampered tokens", () =>
  expect(verifyPreview(signPreview(p) + "x")).toBeNull());
it("rejects expired tokens", () =>
  expect(verifyPreview(signPreview({ ...p, expires: 0 }))).toBeNull());
it("rejects malformed tokens", () =>
  expect(verifyPreview("invalid.value.extra")).toBeNull());
