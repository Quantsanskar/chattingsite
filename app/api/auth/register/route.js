import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { validateRegistration, sanitizeInput } from "@/lib/validation"
import { generateToken } from "@/lib/auth"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { username, email, password, confirmPassword } = body

    // Sanitize inputs
    const sanitizedData = {
      username: sanitizeInput(username),
      email: sanitizeInput(email).toLowerCase(),
      password,
      confirmPassword,
    }

    // Validate input
    const validation = validateRegistration(sanitizedData)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: sanitizedData.email }, { username: sanitizedData.username }],
    })

    if (existingUser) {
      const error = existingUser.email === sanitizedData.email ? "email" : "username"
      return NextResponse.json(
        {
          success: false,
          errors: { [error]: `This ${error} is already registered` },
        },
        { status: 400 },
      )
    }

    // Create new user
    const newUser = new User({
      username: sanitizedData.username,
      email: sanitizedData.email,
      password: sanitizedData.password,
    })

    await newUser.save()

    // Generate JWT token
    const token = generateToken(newUser._id)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
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
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
