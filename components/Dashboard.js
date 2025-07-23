"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MessageCircle, Users, UserPlus, LogOut, Send, Check, X, Clock } from "lucide-react"
import ChatWindow from "@/components/ChatWindow"

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("chats")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [connectionRequests, setConnectionRequests] = useState({ received: [], sent: [] })
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    const handleTabChange = async () => {
      if (activeTab === "requests") {
        await fetchConnectionRequests()
      } else if (activeTab === "chats") {
        await fetchChats()
      }
    }

    handleTabChange()
  }, [activeTab])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats")
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    }
  }

  const fetchConnectionRequests = async () => {
    if (isLoadingRequests) return

    setIsLoadingRequests(true)
    try {
      const response = await fetch("/api/connections/requests")
      if (response.ok) {
        const data = await response.json()
        setConnectionRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch connection requests:", error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    if (isSearching) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const sendConnectionRequest = async (targetUserId) => {
    try {
      const response = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      })

      if (response.ok) {
        setSearchResults((prev) =>
          prev.map((user) => (user._id === targetUserId ? { ...user, connectionStatus: "sent" } : user)),
        )
      }
    } catch (error) {
      console.error("Failed to send connection request:", error)
    }
  }

  const respondToRequest = async (requesterId, action) => {
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action }),
      })

      if (response.ok) {
        fetchConnectionRequests()
      }
    } catch (error) {
      console.error("Failed to respond to request:", error)
    }
  }

  const startChat = async (participantId) => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      })

      if (response.ok) {
        const data = await response.json()
        setActiveChat(data.chat)
        setActiveTab("chats")
      }
    } catch (error) {
      console.error("Failed to start chat:", error)
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query)
    }, 300)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "sent":
        return "bg-yellow-500"
      case "received":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connected"
      case "sent":
        return "Request Sent"
      case "received":
        return "Request Received"
      default:
        return "Connect"
    }
  }

  if (activeChat) {
    return <ChatWindow chat={activeChat} currentUser={user} onBack={() => setActiveChat(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 border-2 border-purple-400">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-purple-600 text-white">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {user.username}</h1>
              <p className="text-gray-300">Ready to connect and chat?</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main Content */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 mb-6">
                <TabsTrigger value="chats" className="data-[state=active]:bg-white/20">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="search" className="data-[state=active]:bg-white/20">
                  <Search className="w-4 h-4 mr-2" />
                  Find People
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-white/20">
                  <Users className="w-4 h-4 mr-2" />
                  Requests
                  {connectionRequests.received.length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">{connectionRequests.received.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chats" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Your Conversations</h3>
                  {chats.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No conversations yet</p>
                      <p className="text-gray-500">Start by finding people to connect with</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                          >
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={chat.participant.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="bg-purple-600 text-white">
                                  {chat.participant.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {chat.participant.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-white truncate">{chat.participant.username}</h4>
                                <span className="text-xs text-gray-400">
                                  {new Date(chat.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 truncate">
                                {chat.lastMessage?.content || "Start a conversation..."}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search for people by username or email..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {isSearching && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {searchResults.map((foundUser) => (
                          <div
                            key={foundUser._id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={foundUser.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-purple-600 text-white">
                                    {foundUser.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {foundUser.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{foundUser.username}</h4>
                                <p className="text-sm text-gray-400">{foundUser.email}</p>
                                {foundUser.bio && <p className="text-xs text-gray-500 mt-1">{foundUser.bio}</p>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(foundUser.connectionStatus)} text-white`}>
                                {getStatusText(foundUser.connectionStatus)}
                              </Badge>
                              {foundUser.connectionStatus === "none" && (
                                <Button
                                  onClick={() => sendConnectionRequest(foundUser._id)}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Connect
                                </Button>
                              )}
                              {foundUser.connectionStatus === "connected" && (
                                <Button
                                  onClick={() => startChat(foundUser._id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Chat
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No users found</p>
                      <p className="text-gray-500">Try a different search term</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests" className="mt-0">
                <div className="space-y-6">
                  {/* Received Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Connection Requests ({connectionRequests.received.length})
                    </h3>
                    {isLoadingRequests ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      </div>
                    ) : connectionRequests.received.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No pending requests</p>
                        <p className="text-gray-500">New connection requests will appear here</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {connectionRequests.received.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={request.from.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-purple-600 text-white">
                                    {request.from.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-white">{request.from.username}</h4>
                                  <p className="text-sm text-gray-400">{request.from.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Sent {new Date(request.receivedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={() => respondToRequest(request.from._id, "accept")}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  onClick={() => respondToRequest(request.from._id, "reject")}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  {/* Sent Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sent Requests ({connectionRequests.sent.length})
                    </h3>
                    {connectionRequests.sent.length === 0 ? (
                      <div className="text-center py-8">
                        <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No sent requests</p>
                        <p className="text-gray-500">Requests you send will appear here</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {connectionRequests.sent.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={request.to.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-purple-600 text-white">
                                    {request.to.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-white">{request.to.username}</h4>
                                  <p className="text-sm text-gray-400">{request.to.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Sent {new Date(request.sentAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-yellow-500 text-white">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
