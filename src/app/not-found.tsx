import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="standalone-state">
      <Link className="wordmark" href="/">
        the current.
      </Link>
      <span className="eyebrow accent">404 / PAGE NOT FOUND</span>
      <h1>This story isn’t here.</h1>
      <p>It may have moved or is no longer available.</p>
      <Link href="/" className="button">
        Back to the latest →
      </Link>
    </main>
  );
}
