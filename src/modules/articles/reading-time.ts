import type { RichNode } from "./content";

const wordsPerMinute = 200;
const words = new Intl.Segmenter("id", { granularity: "word" });

function visibleText(node: RichNode): string {
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "paragraph":
    case "heading":
      return (node.content ?? []).map(visibleText).join("") + "\n";
    case "doc":
    case "blockquote":
    case "bulletList":
    case "orderedList":
    case "listItem":
      return (node.content ?? []).map(visibleText).join("");
    case "hardBreak":
    case "horizontalRule":
    case "image":
      return "\n";
    default:
      return "";
  }
}

export function readingMinutes(body: RichNode): number {
  let wordCount = 0;
  for (const segment of words.segment(visibleText(body))) {
    if (segment.isWordLike) wordCount++;
  }
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
