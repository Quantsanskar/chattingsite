import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Chat from "@/models/Chat"
import { getAuthUser } from "@/lib/auth"
import { sanitizeInput } from "@/lib/validation"

export async function GET(request, { params }) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = params
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    }).populate("messages.sender", "username avatar")

    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 })
    }

    // Get paginated messages (newest first)
    const totalMessages = chat.messages.length
    const startIndex = Math.max(0, totalMessages - page * limit)
    const endIndex = totalMessages - (page - 1) * limit

    const messages = chat.messages.slice(startIndex, endIndex).reverse() // Reverse to show newest first

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        hasMore: startIndex > 0,
      },
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()

    const userId = await getAuthUser(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = params
    const { content, messageType = "text" } = await request.json()

    const sanitizedContent = sanitizeInput(content)
    if (!sanitizedContent || sanitizedContent.length > 1000) {
      return NextResponse.json({ success: false, message: "Invalid message content" }, { status: 400 })
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    })

    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 })
    }

    // Create new message
    const newMessage = {
      sender: userId,
      content: sanitizedContent,
      messageType,
      readBy: [{ user: userId, readAt: new Date() }],
    }

    chat.messages.push(newMessage)
    chat.lastMessage = {
      content: sanitizedContent,
      sender: userId,
      timestamp: new Date(),
    }

    await chat.save()

    // Populate the new message for response
    await chat.populate("messages.sender", "username avatar")
    const savedMessage = chat.messages[chat.messages.length - 1]

    return NextResponse.json({
      success: true,
      message: savedMessage,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
