import { getCurrentSession } from "@/lib/sessions"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const { user } = await getCurrentSession()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
