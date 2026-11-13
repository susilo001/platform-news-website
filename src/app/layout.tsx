import type { Metadata } from "next";
import { siteUrl, isDemo } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: isDemo ? { index: false, follow: false } : undefined,
  title: {
    default: "The Current — A wider perspective",
    template: "%s | The Current",
  },
  description:
    "Independent journalism on the stories that matter. Explore world news, technology, business, culture and science.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
