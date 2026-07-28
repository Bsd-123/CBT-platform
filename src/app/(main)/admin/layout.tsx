import { assertAdminAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertAdminAccess();
  return children;
}
