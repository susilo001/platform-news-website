import { it, expect } from "vitest";
import { parseBody, bodyText } from "@/modules/articles/content";
import { detectImage } from "@/modules/media/validation";
it("rejects unknown rich-text nodes", () =>
  expect(() =>
    parseBody({ type: "doc", content: [{ type: "script", text: "alert(1)" }] }),
  ).toThrow());
it("rejects script links", () =>
  expect(() =>
    parseBody({
      type: "doc",
      content: [
        {
          type: "text",
          text: "bad",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    }),
  ).toThrow());
it("rejects image without alt text", () =>
  expect(() =>
    parseBody({
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://example.com/a.png" } }],
    }),
  ).toThrow());
it("rejects protocol-relative images", () =>
  expect(() =>
    parseBody({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "//evil.test/a", alt: "test" } },
      ],
    }),
  ).toThrow());
it("extracts plain text from structured content", () =>
  expect(
    bodyText(
      parseBody({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      }),
    ),
  ).toBe("Hello world"));
it("rejects fake images by signature", () =>
  expect(() =>
    detectImage(new TextEncoder().encode("<svg onload='alert(1)'></svg>")),
  ).toThrow());
it("detects PNG signature", () =>
  expect(
    detectImage(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])).mime,
  ).toBe("image/png"));
it("requires a root document", () =>
  expect(() => parseBody({ type: "paragraph" })).toThrow());
