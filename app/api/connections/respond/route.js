import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { getAuthUser } from "@/lib/auth"

export async function POST(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { requesterId, action } = await request.json()

    if (!requesterId || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 })
    }

    // Get both users
    const [currentUser, requesterUser] = await Promise.all([User.findById(userId), User.findById(requesterId)])

    if (!currentUser || !requesterUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if request exists
    const requestIndex = currentUser.connectionRequests.received.findIndex((req) => req.from.equals(requesterId))

    if (requestIndex === -1) {
      return NextResponse.json({ success: false, message: "Connection request not found" }, { status: 404 })
    }

    // Remove the request from both users
    currentUser.connectionRequests.received.splice(requestIndex, 1)

    const sentRequestIndex = requesterUser.connectionRequests.sent.findIndex((req) => req.to.equals(userId))
    if (sentRequestIndex !== -1) {
      requesterUser.connectionRequests.sent.splice(sentRequestIndex, 1)
    }

    if (action === "accept") {
      // Add to connections for both users
      currentUser.connections.push(requesterId)
      requesterUser.connections.push(userId)
    }

    await Promise.all([currentUser.save(), requesterUser.save()])

    return NextResponse.json({
      success: true,
      message: action === "accept" ? "Connection request accepted" : "Connection request rejected",
    })
  } catch (error) {
    console.error("Respond to connection request error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
