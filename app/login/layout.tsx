import { getCurrentSession } from "@/lib/sessions";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getCurrentSession();

  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
