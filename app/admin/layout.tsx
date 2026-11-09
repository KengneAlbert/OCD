import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin OCD Live" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-surface">{children}</div>;
}
