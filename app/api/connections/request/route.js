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

    const { targetUserId } = await request.json()

    if (!targetUserId || targetUserId === userId) {
      return NextResponse.json({ success: false, message: "Invalid target user" }, { status: 400 })
    }

    // Get both users
    const [currentUser, targetUser] = await Promise.all([User.findById(userId), User.findById(targetUserId)])

    if (!currentUser || !targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if already connected
    if (currentUser.connections.includes(targetUserId)) {
      return NextResponse.json({ success: false, message: "Already connected" }, { status: 400 })
    }

    // Check if request already sent
    const alreadySent = currentUser.connectionRequests.sent.some((req) => req.to.equals(targetUserId))
    if (alreadySent) {
      return NextResponse.json({ success: false, message: "Connection request already sent" }, { status: 400 })
    }

    // Check if request already received (they sent us a request)
    const alreadyReceived = currentUser.connectionRequests.received.some((req) => req.from.equals(targetUserId))
    if (alreadyReceived) {
      return NextResponse.json(
        { success: false, message: "This user has already sent you a connection request" },
        { status: 400 },
      )
    }

    // Add to sent requests for current user
    currentUser.connectionRequests.sent.push({
      to: targetUserId,
      sentAt: new Date(),
    })

    // Add to received requests for target user
    targetUser.connectionRequests.received.push({
      from: userId,
      receivedAt: new Date(),
    })

    await Promise.all([currentUser.save(), targetUser.save()])

    return NextResponse.json({
      success: true,
      message: "Connection request sent successfully",
    })
  } catch (error) {
    console.error("Send connection request error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
