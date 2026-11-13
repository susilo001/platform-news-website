import Link from "next/link";
import { signIn } from "@/auth";
import { isDemo } from "@/lib/config";
import { ArrowUpRight, Feather } from "lucide-react";
export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main id="main" className="login-page">
      <div className="login-editorial">
        <Link href="/" className="wordmark">
          the current<span className="brand-dot">.</span>
        </Link>
        <div>
          <span className="eyebrow">THE EDITORIAL WORKSPACE</span>
          <h1>
            Good stories
            <br />
            start with
            <br />a fresh perspective<span>.</span>
          </h1>
          <p>
            A space to write, collaborate, and bring meaningful journalism to
            the world.
          </p>
        </div>
        <span>Independent by nature. Curious by design.</span>
      </div>
      <div className="login-form">
        <Feather className="accent" size={32} />
        <span className="eyebrow accent">WELCOME TO THE NEWSROOM</span>
        <h2>Let’s get to work.</h2>
        <p>
          Sign in with your invited staff account to access your editorial
          workspace.
        </p>
        {error && (
          <div className="notice error" role="alert">
            Sign-in was unsuccessful. Use the verified GitHub email invited by
            your publication admin.
          </div>
        )}
        {!isDemo ? (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/cms" });
            }}
          >
            <button className="button">
              Continue with GitHub <ArrowUpRight size={17} />
            </button>
          </form>
        ) : (
          <div className="notice">
            Staff sign-in requires the database and GitHub OAuth configuration.
            The demo workspace is available below.
          </div>
        )}
        <Link href="/demo" className="button secondary">
          Explore the demo newsroom <ArrowUpRight size={16} />
        </Link>
        <small>
          Access is limited to active, invited team members.
          <br />
          Need access? Contact your publication administrator.
        </small>
        <Link className="text-link" href="/">
          ← Back to The Current
        </Link>
      </div>
    </main>
  );
}
