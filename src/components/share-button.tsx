"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="button secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      <Share2 size={16} />
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
