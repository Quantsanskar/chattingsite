import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { getAuthUser } from "@/lib/auth"

export async function POST(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (userId) {
      // Update user offline status
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      })
    }

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
