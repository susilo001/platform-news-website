import Link from "next/link";
export const metadata = { title: "About" };
export default function About() {
  return (
    <main id="main" className="about-page">
      <span className="eyebrow accent">INDEPENDENT BY NATURE</span>
      <h1>
        A wider perspective
        <br />
        starts here<span className="brand-dot">.</span>
      </h1>
      <div className="prose">
        <p>
          The Current is a home for thoughtful journalism. We look beyond the
          immediate headline to explore the people, ideas, and decisions shaping
          our world.
        </p>
        <h2>Curiosity is our starting point.</h2>
        <p>
          Our journalists cover world affairs, politics, technology, business,
          culture, and science. Every story goes through editorial review before
          publication.
        </p>
        <h2>Accountability is part of the story.</h2>
        <p>
          We believe readers deserve clear bylines, visible publication dates,
          and a record of meaningful updates. Our editorial workflow supports
          independent review and careful corrections.
        </p>
        <Link className="button" href="/">
          Explore the latest stories →
        </Link>
      </div>
    </main>
  );
}
