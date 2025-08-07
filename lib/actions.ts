"use server";

import { db } from "server/db";
import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
  invalidateSession,
  getCurrentSession,
} from "@/lib/sessions";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await compare(password, user.password))) {
    return { ok: false, message: "Invalid credentials" };
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  redirect("/dashboard");
}

export async function logout() {
  const { session } = await getCurrentSession();

  if (session === null) {
    return {
      ok: false,
      message: "Not authenticated",
    };
  }

  await invalidateSession(session.id);
  await deleteSessionTokenCookie();

  redirect("/login");
}

export async function findPatient(patientId: string) {
  return await db.patient.findUnique({ where: { id: patientId } });
}
