"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  Heading2,
  Quote,
  Undo2,
  Link2,
  ImagePlus,
  ArrowLeft,
  Save,
  Eye,
} from "lucide-react";
import {
  saveStory,
  changeStatus,
  restoreRevision,
  deleteDraft,
} from "@/app/cms/actions";
import { StatusBadge } from "./cms-table";
import type { RichNode } from "@/modules/articles/content";
import type { Role, Status } from "@/modules/workflow/policy";
type Data = {
  id?: string;
  slug: string;
  version: number;
  status: Status;
  title: string;
  summary: string;
  bodyJson: RichNode;
  categoryId: string;
  heroMediaId: string;
  tags: string;
  coauthorIds: string[];
  seoTitle: string;
  seoDescription: string;
  featured?: boolean;
  leadAuthorId: string;
  revisions: {
    id: string;
    version: number;
    title: string;
    createdByName?: string;
    createdAt: string;
  }[];
  reviews: {
    id: string;
    comment: string;
    decision: string;
    reviewerName: string;
    createdAt: string;
  }[];
};
type Props = {
  initial: Data;
  categories: { id: string; name: string }[];
  media: { id: string; url: string; altText: string }[];
  staff: { id: string; name: string }[];
  actor: { id: string; role: Role };
  demo?: boolean;
};
export function ArticleEditor({
  initial,
  categories,
  media,
  staff,
  actor,
  demo = false,
}: Props) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [reason, setReason] = useState("");
  const [due, setDue] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editable =
    !demo &&
    form.status === "DRAFT" &&
    (actor.role !== "JOURNALIST" || actor.id === form.leadAuthorId || !form.id);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      ImageExtension,
    ],
    content: initial.bodyJson,
    immediatelyRender: false,
    editable: editable || demo,
    editorProps: {
      attributes: { class: "tiptap-content", "aria-label": "Article body" },
    },
  });
  // Server-rendered controls must stay disabled until hydration installs event handlers.
  const canWrite = editor !== null && (editable || demo);
  const update = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  const run = (
    fn: () => Promise<{ ok: boolean; error?: string; id?: string }>,
    saved = false,
  ) =>
    startTransition(async () => {
      setMessage("");
      const result = await fn();
      setError(!result.ok);
      setMessage(
        result.ok
          ? saved
            ? "Draft saved."
            : "Article updated."
          : (result.error ?? "Something went wrong."),
      );
      if (result.ok) {
        if (result.id && !form.id)
          router.push(`/cms/articles/${result.id}/edit`);
        else {
          router.refresh();
          if (saved && form.id) window.location.reload();
          else if (!saved) window.location.reload();
        }
      }
    });
  function save() {
    run(() => saveStory({ ...form, bodyJson: editor?.getJSON() }), true);
  }
  function transition(next: Status) {
    if (form.id)
      run(() =>
        changeStatus({
          id: form.id!,
          version: form.version,
          next,
          reason,
          dueAt: due ? new Date(due).toISOString() : undefined,
        }),
      );
  }
  const mediaItem = media.find((m) => m.id === form.heroMediaId);
  return (
    <>
      <div className="editor-top">
        <Link href={demo ? "/demo/articles" : "/cms/articles"}>
          <ArrowLeft size={16} /> All articles
        </Link>
        <div>
          <StatusBadge status={form.status} />
          {form.id && !demo && (
            <button
              className="button secondary"
              onClick={() =>
                startTransition(async () => {
                  const { createPreview } =
                    await import("@/app/cms/preview-action");
                  const r = await createPreview(form.id!);
                  if (r.url)
                    window.open(r.url, "_blank", "noopener,noreferrer");
                  else {
                    setError(true);
                    setMessage(r.error ?? "Unable to create preview.");
                  }
                })
              }
            >
              <Eye size={15} />
              Preview
            </button>
          )}
          <button
            className="button"
            disabled={pending || !editable || !editor}
            onClick={save}
          >
            <Save size={15} />
            {pending ? "Saving…" : "Save draft"}
          </button>
        </div>
      </div>
      {demo && (
        <div className="notice">
          Try writing in the editor. This sample workspace doesn’t save or
          publish changes.
        </div>
      )}
      {message && (
        <div role="status" className={`notice ${error ? "error" : ""}`}>
          {message}
        </div>
      )}
      <div className="editor-layout">
        <section className="editor-canvas">
          <span className="eyebrow accent">EVERY GREAT STORY STARTS HERE</span>
          <input
            aria-label="Article title"
            className="title-input"
            placeholder="Give your story a headline…"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            disabled={!canWrite}
          />
          <textarea
            aria-label="Article summary"
            className="summary-input"
            placeholder="Set the scene with a short, compelling summary…"
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            disabled={!canWrite}
          />
          <div className="editor-toolbar">
            {[
              {
                icon: Bold,
                title: "Bold",
                action: () => editor?.chain().focus().toggleBold().run(),
              },
              {
                icon: Italic,
                title: "Italic",
                action: () => editor?.chain().focus().toggleItalic().run(),
              },
              {
                icon: Heading2,
                title: "Heading",
                action: () =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                icon: List,
                title: "Bullet list",
                action: () => editor?.chain().focus().toggleBulletList().run(),
              },
              {
                icon: Quote,
                title: "Quote",
                action: () => editor?.chain().focus().toggleBlockquote().run(),
              },
              {
                icon: Link2,
                title: "Add link",
                action: () => {
                  const href = prompt("Link URL (https://…)");
                  if (href && /^https?:\/\//.test(href))
                    editor?.chain().focus().setLink({ href }).run();
                },
              },
              {
                icon: ImagePlus,
                title: "Insert image",
                action: () => {
                  const src = prompt("Image URL (https://…)");
                  const alt = src
                    ? prompt("Describe the image for readers")
                    : null;
                  if (src && alt && /^https?:\/\//.test(src))
                    editor?.chain().focus().setImage({ src, alt }).run();
                },
              },
              {
                icon: Undo2,
                title: "Undo",
                action: () => editor?.chain().focus().undo().run(),
              },
            ].map((b) => (
              <button
                key={b.title}
                type="button"
                title={b.title}
                aria-label={b.title}
                disabled={!canWrite}
                onClick={b.action}
              >
                <b.icon size={17} />
              </button>
            ))}
          </div>
          <EditorContent editor={editor} />
          <div className="editor-wordcount">
            Write with clarity. Publish with purpose.
          </div>
          {form.reviews.length > 0 && (
            <div className="review-notes">
              <h3>Editorial notes</h3>
              {form.reviews.map((r) => (
                <div key={r.id}>
                  <strong>
                    {r.reviewerName} · {r.decision.toLowerCase()}
                  </strong>
                  <p>{r.comment || "Approved without comments."}</p>
                  <small>{new Date(r.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="editor-settings">
          <section className="panel">
            <div className="panel-heading">
              <h3>Story details</h3>
            </div>
            <div className="panel-body">
              <label>
                Category
                <select
                  value={form.categoryId}
                  disabled={!canWrite}
                  onChange={(e) => update("categoryId", e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {actor.role !== "JOURNALIST" && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.featured ?? false}
                    disabled={!canWrite}
                    onChange={(e) => update("featured", e.target.checked)}
                  />{" "}
                  Feature on homepage
                </label>
              )}
              <label>
                URL slug
                <input
                  value={form.slug}
                  disabled={!canWrite}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="your-story-headline"
                />
              </label>
              <label>
                Tags
                <input
                  value={form.tags}
                  disabled={!canWrite}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="Climate, Cities, Design"
                />
              </label>
              <label>
                Co-authors
                <select
                  multiple
                  value={form.coauthorIds}
                  disabled={!canWrite}
                  onChange={(e) =>
                    update(
                      "coauthorIds",
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                >
                  {staff
                    .filter((s) => s.id !== form.leadAuthorId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <small>Hold Ctrl / Cmd to select multiple authors.</small>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h3>Hero image</h3>
            </div>
            <div className="panel-body">
              {mediaItem ? (
                <img
                  className="editor-hero"
                  src={mediaItem.url}
                  alt={mediaItem.altText}
                />
              ) : (
                <div className="upload-placeholder">
                  <ImagePlus size={24} />
                  <span>Give your story a visual</span>
                </div>
              )}
              <label>
                Choose from media library
                <select
                  value={form.heroMediaId}
                  disabled={!canWrite}
                  onChange={(e) => update("heroMediaId", e.target.value)}
                >
                  <option value="">Select an image</option>
                  {media.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.altText}
                    </option>
                  ))}
                </select>
              </label>
              <Link
                href={demo ? "/demo/media" : "/cms/media"}
                className="text-link"
              >
                Open media library ↗
              </Link>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h3>Search appearance</h3>
            </div>
            <div className="panel-body">
              <label>
                SEO title
                <input
                  value={form.seoTitle}
                  disabled={!canWrite}
                  onChange={(e) => update("seoTitle", e.target.value)}
                  placeholder="Defaults to your headline"
                />
              </label>
              <label>
                Meta description
                <textarea
                  value={form.seoDescription}
                  disabled={!canWrite}
                  onChange={(e) => update("seoDescription", e.target.value)}
                  placeholder="Defaults to your summary"
                />
              </label>
            </div>
          </section>
          {!demo && form.id && (
            <section className="panel">
              <div className="panel-heading">
                <h3>Editorial workflow</h3>
              </div>
              <div className="panel-body">
                <label>
                  Editorial reason
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Required for changes, unpublishing, or admin self-approval"
                  />
                </label>
                {form.status === "DRAFT" && (
                  <button
                    disabled={pending}
                    className="button"
                    onClick={() => transition("IN_REVIEW")}
                  >
                    Submit saved draft for review
                  </button>
                )}
                {editable && (
                  <button
                    disabled={pending || !reason.trim()}
                    className="text-link danger"
                    onClick={() =>
                      startTransition(async () => {
                        const r = await deleteDraft(
                          form.id!,
                          form.version,
                          reason,
                        );
                        if (r.ok) router.push("/cms/articles");
                        else {
                          setError(true);
                          setMessage(r.error ?? "Unable to delete draft.");
                        }
                      })
                    }
                  >
                    Delete draft (reason required)
                  </button>
                )}
                {actor.role !== "JOURNALIST" && (
                  <>
                    {form.status === "IN_REVIEW" && (
                      <>
                        <button
                          disabled={pending}
                          className="button"
                          onClick={() => transition("APPROVED")}
                        >
                          Approve revision
                        </button>
                        <button
                          disabled={pending}
                          className="button secondary"
                          onClick={() => transition("DRAFT")}
                        >
                          Request changes
                        </button>
                      </>
                    )}
                    {form.status === "APPROVED" && (
                      <>
                        <button
                          disabled={pending}
                          className="button"
                          onClick={() => transition("PUBLISHED")}
                        >
                          Publish now
                        </button>
                        <label>
                          Publish at (your local time)
                          <input
                            type="datetime-local"
                            value={due}
                            onChange={(e) => setDue(e.target.value)}
                          />
                        </label>
                        <small>Converted to UTC before saving.</small>
                        <button
                          disabled={pending || !due}
                          className="button secondary"
                          onClick={() => transition("SCHEDULED")}
                        >
                          Schedule publication
                        </button>
                      </>
                    )}
                    {form.status === "SCHEDULED" && (
                      <button
                        disabled={pending}
                        className="button secondary"
                        onClick={() => transition("DRAFT")}
                      >
                        Cancel schedule & revise
                      </button>
                    )}
                    {form.status === "PUBLISHED" && (
                      <button
                        disabled={pending}
                        className="button secondary"
                        onClick={() => transition("UNPUBLISHED")}
                      >
                        Unpublish story
                      </button>
                    )}
                    {form.status === "UNPUBLISHED" && (
                      <button
                        disabled={pending}
                        className="button secondary"
                        onClick={() => transition("DRAFT")}
                      >
                        Return to draft
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
          {form.revisions.length > 0 && (
            <section className="panel">
              <div className="panel-heading">
                <h3>Revision history</h3>
              </div>
              <div className="panel-body">
                {form.revisions.map((r) => (
                  <div key={r.id} className="revision-row">
                    <div>
                      <strong>Version {r.version}</strong>
                      <small>{r.title}</small>
                      <small>{r.createdByName ?? "Sample author"}</small>
                      <small>{new Date(r.createdAt).toLocaleString()}</small>
                    </div>
                    {editable && (
                      <button
                        className="text-link"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            restoreRevision(form.id!, r.id, form.version),
                          )
                        }
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
