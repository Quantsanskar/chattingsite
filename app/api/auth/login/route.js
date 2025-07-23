import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { validateLogin, sanitizeInput } from "@/lib/validation"
import { generateToken } from "@/lib/auth"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password } = body

    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(email).toLowerCase(),
      password,
    }

    // Validate input
    const validation = validateLogin(sanitizedData)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ email: sanitizedData.email })
    if (!user) {
      return NextResponse.json({ success: false, errors: { email: "Invalid email or password" } }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(sanitizedData.password)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, errors: { password: "Invalid email or password" } }, { status: 401 })
    }

    // Update user online status
    user.isOnline = true
    user.lastSeen = new Date()
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
