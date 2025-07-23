"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, MoreVertical, Phone, Video } from "lucide-react"

export default function ChatWindow({ chat, currentUser, onBack }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const scrollAreaRef = useRef(null)

  const otherParticipant = chat.participants.find((p) => p._id !== currentUser.id)

  useEffect(() => {
    let mounted = true

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chats/${chat.id}/messages`)
        if (response.ok && mounted) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMessages()

    return () => {
      mounted = false
    }
  }, [chat.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
      } else {
        // Restore message on error
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl h-[calc(100vh-2rem)]">
          {/* Chat Header */}
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button onClick={onBack} variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={otherParticipant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {otherParticipant.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {otherParticipant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{otherParticipant.username}</h3>
                    <p className="text-xs text-gray-400">
                      {otherParticipant.isOnline ? "Online" : `Last seen ${formatDate(otherParticipant.lastSeen)}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-0 flex flex-col h-[calc(100vh-12rem)]">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg">Start the conversation</p>
                    <p className="text-gray-500">Send a message to {otherParticipant.username}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(messageGroups).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-white/10 px-3 py-1 rounded-full">
                          <span className="text-xs text-gray-300">{formatDate(date)}</span>
                        </div>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-3">
                        {dateMessages.map((message, index) => {
                          const isOwnMessage = message.sender._id === currentUser.id
                          const showAvatar =
                            !isOwnMessage && (index === 0 || dateMessages[index - 1].sender._id !== message.sender._id)

                          return (
                            <div
                              key={message._id}
                              className={`flex items-end space-x-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              {!isOwnMessage && (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar && (
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
                                      <AvatarFallback className="bg-purple-600 text-white text-xs">
                                        {message.sender.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}

                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                  isOwnMessage
                                    ? "bg-purple-600 text-white rounded-br-md"
                                    : "bg-white/10 text-white rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwnMessage ? "text-purple-200" : "text-gray-400"}`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${otherParticipant.username}...`}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
