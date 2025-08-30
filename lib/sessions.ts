import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding"
import { sha256 } from "@oslojs/crypto/sha2"
import { cookies } from "next/headers"
import { db } from "@/server/db"
import type { User, Session } from "@prisma/client"

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)

  const token = encodeBase32LowerCaseNoPadding(bytes)

  return token
}

export async function createSession(token: string, userId: number): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  }
  await db.session.create({
    data: session,
  })
  return session
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const result = await db.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  })
  if (result === null) {
    return { session: null, user: null }
  }
  const { user, ...session } = result
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.session.delete({ where: { id: sessionId } })
    return { session: null, user: null }
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    await db.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: session.expiresAt,
      },
    })
  }
  return { session, user }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.session.delete({ where: { id: sessionId } })
}

export async function invalidateAllSessions(userId: number): Promise<void> {
  await db.session.deleteMany({
    where: {
      userId: userId,
    },
  })
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null }

export async function setSessionTokenCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  })
}

export async function getCurrentSession() {
  try {
    const sessionToken = cookies().get("session_token")?.value

    if (!sessionToken) {
      return { user: null }
    }

    // Find session
    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    })

    // Check if session exists and is not expired
    if (!session || session.expires < new Date()) {
      if (session) {
        // Delete expired session
        await db.session.delete({
          where: { id: sessionToken },
        })
      }
      cookies().delete("session_token")
      return { user: null }
    }

    return { user: session.user }
  } catch (error) {
    console.error("Session error:", error)
    return { user: null }
  }
}
