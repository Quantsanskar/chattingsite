import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { getAuthUser } from "@/lib/auth"

export async function GET(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findById(userId)
      .populate("connectionRequests.received.from", "username email avatar bio isOnline lastSeen")
      .populate("connectionRequests.sent.to", "username email avatar bio isOnline lastSeen")

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      received: user.connectionRequests.received,
      sent: user.connectionRequests.sent,
    })
  } catch (error) {
    console.error("Get connection requests error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
