"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Send, 
  Search, 
  MoreHorizontal, 
  MessageCircle, 
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface PlatformInfo {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const PLATFORMS: Record<string, PlatformInfo> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: <Twitter className="w-4 h-4" />,
    color: 'text-black',
    bgColor: 'bg-gray-100'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  email: {
    id: 'email',
    name: 'Email',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

interface Conversation {
  id: string
  contactName: string
  contactId: string
  platform: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  avatar?: string
  isOnline?: boolean
  phoneNumber?: string
  email?: string
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  isOwn: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  attachments?: Array<{
    type: 'image' | 'file' | 'video'
    url: string
    name: string
  }>
}

interface Comment {
  id: string
  platform: string
  postId: string
  postContent?: string
  authorName: string
  authorId: string
  content: string
  timestamp: Date
  avatar?: string
  replies?: Comment[]
  postUrl?: string
}

export function MessagesScreen() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newReply, setNewReply] = useState("")
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch connected platforms
  useEffect(() => {
    fetchConnectedPlatforms()
  }, [])

  // Fetch conversations when platforms are loaded
  useEffect(() => {
    if (connectedPlatforms.length > 0) {
      fetchConversations()
      fetchComments()
    }
  }, [connectedPlatforms])

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConnectedPlatforms = async () => {
    try {
      const response = await fetch('/api/integrations/status')
      if (response.ok) {
        const data = await response.json()
        const connected = data.integrations
          .filter((i: any) => i.status === 'connected')
          .map((i: any) => i.id)
          .filter((id: string) => PLATFORMS[id]) // Only messaging platforms
        setConnectedPlatforms(connected)
        setSelectedPlatforms(connected) // Select all by default
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error)
    }
  }

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        // Use mock data if API is not ready
        setConversations(getMockConversations())
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      // Use mock data as fallback
      setConversations(getMockConversations())
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        // Use mock data if API is not ready
        setMessages(getMockMessages(conversationId))
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages(getMockMessages(conversationId))
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/comments')
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        setComments(getMockComments())
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setComments(getMockComments())
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchConversations(),
      fetchComments(),
      selectedConversation && fetchMessages(selectedConversation.id)
    ])
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Messages and comments updated",
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          platform: selectedConversation.platform,
          content: newMessage,
        })
      })

      if (response.ok) {
        setNewMessage("")
        await fetchMessages(selectedConversation.id)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReplyToComment = async () => {
    if (!newReply.trim() || !selectedComment) return

    try {
      const response = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: selectedComment.id,
          platform: selectedComment.platform,
          content: newReply,
        })
      })

      if (response.ok) {
        setNewReply("")
        setSelectedComment(null)
        await fetchComments()
        toast({
          title: "Reply sent",
          description: "Your reply has been posted",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      })
    }
  }

  // Filter conversations based on search and selected platforms
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = selectedPlatforms.length === 0 || 
                           selectedPlatforms.includes(conv.platform)
    return matchesSearch && matchesPlatform
  })

  // Filter comments based on selected platforms
  const filteredComments = comments.filter(comment => 
    selectedPlatforms.length === 0 || selectedPlatforms.includes(comment.platform)
  )

  // Mock data generators
  function getMockConversations(): Conversation[] {
    return [
      {
        id: '1',
        contactName: 'Sarah Johnson',
        contactId: 'fb_123',
        platform: 'facebook',
        lastMessage: 'Thanks for your quick response! I really appreciate your help with this.',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        avatar: '/placeholder.svg?height=40&width=40',
        isOnline: true,
      },
      {
        id: '2',
        contactName: 'Mike Chen',
        contactId: 'ig_456',
        platform: 'instagram',
        lastMessage: 'Love your latest post! Can you share more details about your products?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
        unreadCount: 1,
        avatar: '/placeholder.svg?height=40&width=40',
      },
      {
        id: '3',
        contactName: 'Emma Wilson',
        contactId: 'wa_789',
        platform: 'whatsapp',
        lastMessage: 'Hi! I\'d like to place an order for the items we discussed.',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
        unreadCount: 0,
        phoneNumber: '+1234567890',
        isOnline: true,
      },
      {
        id: '4',
        contactName: 'David Lee',
        contactId: 'tw_321',
        platform: 'twitter',
        lastMessage: 'Great thread! Following up on our DM conversation...',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
        unreadCount: 0,
      },
      {
        id: '5',
        contactName: 'Jennifer Smith',
        contactId: 'li_654',
        platform: 'linkedin',
        lastMessage: 'Thank you for connecting! I\'d love to discuss potential collaboration.',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        unreadCount: 3,
      },
    ]
  }

  function getMockMessages(conversationId: string): Message[] {
    return [
      {
        id: '1',
        conversationId,
        senderId: 'contact',
        senderName: 'Contact',
        content: 'Hi! I saw your recent post and I\'m interested in learning more.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isOwn: false,
        status: 'read'
      },
      {
        id: '2',
        conversationId,
        senderId: 'me',
        senderName: 'You',
        content: 'Thank you for reaching out! I\'d be happy to provide more information.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        isOwn: true,
        status: 'read'
      },
      {
        id: '3',
        conversationId,
        senderId: 'contact',
        senderName: 'Contact',
        content: 'That would be great! Can you share your catalog?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: false,
        status: 'read'
      },
      {
        id: '4',
        conversationId,
        senderId: 'me',
        senderName: 'You',
        content: 'Sure! Let me send you our latest catalog with all the details.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        isOwn: true,
        status: 'delivered'
      },
    ]
  }

  function getMockComments(): Comment[] {
    return [
      {
        id: '1',
        platform: 'facebook',
        postId: 'post_123',
        postContent: 'Check out our new product launch!',
        authorName: 'Alex Turner',
        authorId: 'fb_user_1',
        content: 'This looks amazing! When will it be available in stores?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        avatar: '/placeholder.svg?height=40&width=40',
        postUrl: 'https://facebook.com/post/123',
      },
      {
        id: '2',
        platform: 'instagram',
        postId: 'post_456',
        postContent: 'Behind the scenes of our photoshoot',
        authorName: 'Sophie Martin',
        authorId: 'ig_user_2',
        content: 'Love the aesthetic! What camera did you use?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        avatar: '/placeholder.svg?height=40&width=40',
        postUrl: 'https://instagram.com/p/456',
      },
      {
        id: '3',
        platform: 'linkedin',
        postId: 'post_789',
        postContent: 'Excited to announce our partnership',
        authorName: 'Robert Chen',
        authorId: 'li_user_3',
        content: 'Congratulations on this milestone! This is a game-changer for the industry.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        avatar: '/placeholder.svg?height=40&width=40',
        postUrl: 'https://linkedin.com/post/789',
      },
    ]
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getMessageStatus = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unified Inbox</h1>
          <p className="text-gray-600">Manage all your messages and comments in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {selectedPlatforms.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPlatforms.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Platforms</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {connectedPlatforms.map(platform => (
                <DropdownMenuCheckboxItem
                  key={platform}
                  checked={selectedPlatforms.includes(platform)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, platform])
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {PLATFORMS[platform]?.icon}
                    <span>{PLATFORMS[platform]?.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {connectedPlatforms.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Messaging Platforms Connected</h3>
          <p className="text-gray-600 mb-4">
            Connect your messaging platforms to start managing conversations
          </p>
          <Button onClick={() => window.location.href = '/dashboard/integrations'}>
            Connect Platforms
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="messages">
              Messages
              {filteredConversations.filter(c => c.unreadCount > 0).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {filteredConversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments
              {filteredComments.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredComments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Conversations</h3>
                  <Badge variant="outline">
                    {filteredConversations.length}
                  </Badge>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search conversations..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[480px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No conversations found
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const platform = PLATFORMS[conversation.platform]
                      return (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={cn(
                            "flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                            selectedConversation?.id === conversation.id 
                              ? "bg-blue-50 border-blue-200" 
                              : "hover:bg-gray-50"
                          )}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={conversation.avatar} />
                              <AvatarFallback>
                                {conversation.contactName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                            {platform && (
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                                platform.bgColor
                              )}>
                                <div className={platform.color}>
                                  {React.cloneElement(platform.icon as React.ReactElement, {
                                    className: "w-3 h-3"
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {conversation.contactName}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {conversation.lastMessage}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="outline" className="text-xs">
                                {platform?.name}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              {/* Chat Area */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <Card className="h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={selectedConversation.avatar} />
                              <AvatarFallback>
                                {selectedConversation.contactName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {selectedConversation.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedConversation.contactName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {PLATFORMS[selectedConversation.platform]?.name}
                              </Badge>
                              {selectedConversation.isOnline && (
                                <span className="text-green-600">Active now</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Block Contact
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={cn(
                            "flex",
                            message.isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className="max-w-xs lg:max-w-md space-y-1">
                            <div
                              className={cn(
                                "px-4 py-3 rounded-2xl",
                                message.isOwn
                                  ? "text-white rounded-br-md"
                                  : "bg-gray-100 text-gray-900 rounded-bl-md"
                              )}
                              style={message.isOwn ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 text-xs text-gray-500",
                              message.isOwn ? "justify-end" : "justify-start"
                            )}>
                              <span>{formatTime(message.timestamp)}</span>
                              {message.isOwn && getMessageStatus(message.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          disabled={sendingMessage}
                        />
                        <Button
                          size="icon"
                          style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                          className="hover:opacity-90 text-white rounded-full"
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          {sendingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Recent Comments</h3>
                  <Badge variant="outline">
                    {filteredComments.length}
                  </Badge>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto">
                  {filteredComments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No comments to display
                    </div>
                  ) : (
                    filteredComments.map((comment) => {
                      const platform = PLATFORMS[comment.platform]
                      return (
                        <div key={comment.id} className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={comment.avatar} />
                                <AvatarFallback>
                                  {comment.authorName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {platform && (
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                                  platform.bgColor
                                )}>
                                  <div className={platform.color}>
                                    {React.cloneElement(platform.icon as React.ReactElement, {
                                      className: "w-3 h-3"
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">
                                  {comment.authorName}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {platform?.name}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatTime(comment.timestamp)}
                                </span>
                              </div>
                              {comment.postContent && (
                                <div className="text-xs text-gray-500 mb-2">
                                  On post: "{comment.postContent}"
                                </div>
                              )}
                              <p className="text-sm text-gray-600">{comment.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 hover:text-blue-700 p-0"
                                  onClick={() => setSelectedComment(comment)}
                                >
                                  Reply
                                </Button>
                                {comment.postUrl && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-gray-700 p-0"
                                    onClick={() => window.open(comment.postUrl, '_blank')}
                                  >
                                    View Post
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              <Card className="p-6">
                {selectedComment ? (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Reply to {selectedComment.authorName}
                    </h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{selectedComment.authorName}</span>
                          <Badge variant="outline" className="text-xs">
                            {PLATFORMS[selectedComment.platform]?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{selectedComment.content}</p>
                      </div>
                      <Textarea 
                        placeholder="Write your reply..." 
                        className="min-h-[120px]"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedComment(null)
                            setNewReply("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                          className="hover:opacity-90 text-white"
                          onClick={handleReplyToComment}
                          disabled={!newReply.trim()}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a comment
                    </h3>
                    <p className="text-gray-600">
                      Click "Reply" on any comment to respond
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}