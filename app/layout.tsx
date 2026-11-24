import type { Metadata } from "next";
import { NavGroupsProvider } from "@/components/nav_groups_provider";
import { list_fd_bank_codes } from "@/lib/fixed_deposits/load";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZYFN",
  description: "Personal finance workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bank_codes = await list_fd_bank_codes();

  return (
    <html lang="en">
      <body>
        <NavGroupsProvider bank_codes={bank_codes}>{children}</NavGroupsProvider>
      </body>
    </html>
  );
}