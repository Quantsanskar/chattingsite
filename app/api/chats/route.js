import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Chat from "@/models/Chat"
import User from "@/models/User"
import { getAuthUser } from "@/lib/auth"

export async function GET(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "username avatar isOnline lastSeen")
      .populate("lastMessage.sender", "username")
      .sort({ "lastMessage.timestamp": -1 })

    // Format chats for frontend
    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId)
      return {
        id: chat._id,
        participant: otherParticipant,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        unreadCount: 0, // You can implement unread count logic here
      }
    })

    return NextResponse.json({
      success: true,
      chats: formattedChats,
    })
  } catch (error) {
    console.error("Get chats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { participantId } = await request.json()

    if (!participantId || participantId === userId) {
      return NextResponse.json({ success: false, message: "Invalid participant" }, { status: 400 })
    }

    // Check if users are connected
    const currentUser = await User.findById(userId)
    if (!currentUser.connections.includes(participantId)) {
      return NextResponse.json({ success: false, message: "You can only chat with connected users" }, { status: 403 })
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
      chatType: "private",
    }).populate("participants", "username avatar isOnline lastSeen")

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [userId, participantId],
        chatType: "private",
      })
      await chat.save()
      await chat.populate("participants", "username avatar isOnline lastSeen")
    }

    return NextResponse.json({
      success: true,
      chat: {
        id: chat._id,
        participants: chat.participants,
        messages: chat.messages || [],
        createdAt: chat.createdAt,
      },
    })
  } catch (error) {
    console.error("Create/get chat error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
