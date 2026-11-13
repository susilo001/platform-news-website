"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
export function MediaUpload() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="media-upload-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setMessage("");
        try {
          const r = await fetch("/api/media", {
            method: "POST",
            body: new FormData(form),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          form.reset();
          setMessage("Image uploaded and ready to use.");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Image file
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
        />
      </label>
      <label>
        Describe this image
        <input
          name="altText"
          placeholder="Alt text for readers using assistive technology"
          minLength={3}
          maxLength={500}
          required
        />
      </label>
      <button disabled={busy} className="button">
        <Upload size={16} />
        {busy ? "Uploading…" : "Upload image"}
      </button>
      <small>JPEG, PNG, or WebP · Up to 8 MB · Minimum 100 × 100 pixels</small>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
