import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shaw Tesfaye — Software Engineer & ML Systems",
  description: "Portfolio of Shaw Tesfaye — Software Engineer, ML Systems, Full-Stack Developer, and Researcher based in Atlanta, GA.",
  openGraph: {
    title: "Shaw Tesfaye — Software Engineer & ML Systems",
    description: "Portfolio of Shaw Tesfaye — hackathon winner, ML researcher, and full-stack developer.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
