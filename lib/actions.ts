"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "server/db"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

// Login action
export async function login({
  email,
  password,
}: {
  email: string
  password: string
}) {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    })

    // Check if user exists
    if (!user) {
      return { error: "Invalid email or password" }
    }

    // Check if user is verified
    if (!user.verified) {
      return { error: "Your account is pending verification by an admin" }
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return { error: "Invalid email or password" }
    }

    // Create session
    const sessionToken = uuidv4()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expires,
      },
    })

    // Set session cookie
    cookies().set("session_token", sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Signup action
export async function signup({
  name,
  email,
  password,
  role,
}: {
  name: string
  email: string
  password: string
  role: "ADMIN" | "VOLUNTEER"
}) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Email already in use" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        verified: false, // Requires admin verification
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Logout action
export async function logout() {
  const sessionToken = cookies().get("session_token")?.value

  if (sessionToken) {
    // Delete session from database
    await db.session
      .delete({
        where: { id: sessionToken },
      })
      .catch(() => {
        // Ignore errors if session doesn't exist
      })

    // Clear cookie
    cookies().delete("session_token")
  }

  redirect("/login")
}
