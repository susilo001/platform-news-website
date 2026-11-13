"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="standalone-state">
      <h1>We couldn’t load this page.</h1>
      <p>Please try again in a moment.</p>
      <button onClick={reset} className="button">
        Try again
      </button>
    </main>
  );
}
