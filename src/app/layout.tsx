import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/theme/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Interview Notes",
    template: "%s | Interview Notes",
  },
  description: "Next.js and React interview practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="notion-studio"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("notes-theme");if(t==="notion-studio"||t==="vercel-midnight")document.documentElement.dataset.theme=t}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
