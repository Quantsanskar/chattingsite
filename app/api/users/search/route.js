import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { getAuthUser } from "@/lib/auth"
import { sanitizeInput } from "@/lib/validation"

export async function GET(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = sanitizeInput(searchParams.get("q") || "")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
        pagination: { page, limit, total: 0, pages: 0 },
      })
    }

    // Get current user to exclude from results and check connections
    const currentUser = await User.findById(userId).select("connections connectionRequests")

    // Search users excluding current user
    const searchRegex = new RegExp(query, "i")
    const searchQuery = {
      _id: { $ne: userId },
      $or: [{ username: searchRegex }, { email: searchRegex }],
    }

    const total = await User.countDocuments(searchQuery)
    const users = await User.find(searchQuery)
      .select("username email avatar bio isOnline lastSeen")
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ username: 1 })

    // Add connection status to each user
    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject()
      const isConnected = currentUser.connections.includes(user._id)
      const hasSentRequest = currentUser.connectionRequests.sent.some((req) => req.to.equals(user._id))
      const hasReceivedRequest = currentUser.connectionRequests.received.some((req) => req.from.equals(user._id))

      userObj.connectionStatus = isConnected
        ? "connected"
        : hasSentRequest
          ? "sent"
          : hasReceivedRequest
            ? "received"
            : "none"

      return userObj
    })

    return NextResponse.json({
      success: true,
      users: usersWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
