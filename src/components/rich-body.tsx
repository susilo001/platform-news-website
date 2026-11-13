import { Fragment, type ReactNode } from "react";
import type { RichNode } from "@/modules/articles/content";
function node(n: RichNode, key: number): ReactNode {
  const children = n.content?.map((c, i) => node(c, i));
  if (n.type === "text") {
    let t: ReactNode = n.text;
    for (const mark of n.marks ?? []) {
      if (mark.type === "bold") t = <strong>{t}</strong>;
      if (mark.type === "italic") t = <em>{t}</em>;
      if (mark.type === "strike") t = <s>{t}</s>;
      if (mark.type === "code") t = <code>{t}</code>;
      if (
        mark.type === "link" &&
        /^https?:\/\/|^\/(?!\/)/.test(String(mark.attrs?.href))
      )
        t = (
          <a href={String(mark.attrs?.href)} rel="noopener noreferrer">
            {t}
          </a>
        );
    }
    return <Fragment key={key}>{t}</Fragment>;
  }
  switch (n.type) {
    case "doc":
      return <Fragment key={key}>{children}</Fragment>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return n.attrs?.level === 3 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h2 key={key}>{children}</h2>
      );
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return /^https?:\/\/|^\/(?!\/)/.test(String(n.attrs?.src)) ? (
        <img
          key={key}
          src={String(n.attrs?.src)}
          alt={String(n.attrs?.alt ?? "")}
          loading="lazy"
        />
      ) : null;
    default:
      return null;
  }
}
export function RichBody({ body }: { body: RichNode }) {
  return <div className="prose">{node(body, 0)}</div>;
}
