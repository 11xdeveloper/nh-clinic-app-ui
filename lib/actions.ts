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
import { compare, hash } from "bcryptjs";

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await compare(password, user.password))) {
    return { ok: false, message: "Invalid credentials" };
  }

  if (!user.verified) {
    return {
      ok: false,
      message:
        "You account hasn't been verified yet. Please wait for an admin to approve your account.",
    };
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

export async function signup(
  name: string,
  email: string,
  password: string,
  role: "ADMIN" | "VOLUNTEER",
) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { ok: false, message: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user (unverified by default)
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        verified: false,
      },
    });

    return { ok: true, message: "Account created successfully" };
  } catch (error) {
    console.error("Signup error:", error);
    return { ok: false, message: "Failed to create account" };
  }
}
