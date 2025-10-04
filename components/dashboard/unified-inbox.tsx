"use client"

import { useState, useEffect, useMemo } from "react"
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
  Filter, 
  Archive, 
  MoreHorizontal, 
  MessageCircle, 
  Heart,
  ThumbsUp,
  AlertCircle,
  Facebook,
  Instagram,
  MessageSquare,
  Phone,
  X,
  Check,
  Clock,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Platform icons mapping
const PlatformIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  messenger: MessageSquare,
  whatsapp: Phone,
}

// Platform colors
const PlatformColors: Record<string, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-tr from-purple-600 to-pink-600",
  messenger: "bg-blue-500",
  whatsapp: "bg-green-500",
}

interface PlatformMessage {
  id: string
  platform: 'facebook' | 'instagram' | 'messenger' | 'whatsapp'
  platformUserId: string
  platformUsername: string
  platformProfileUrl?: string
  conversationId: string
  content: string
  attachments?: any[]
  isIncoming: boolean
  status: 'unread' | 'read' | 'replied' | 'archived'
  createdAt: string
  updatedAt: string
}

interface PlatformComment {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter'
  platformPostId: string
  platformUserId: string
  platformUsername: string
  platformProfileUrl?: string
  content: string
  parentCommentId?: string
  isReply: boolean
  sentiment?: 'positive' | 'negative' | 'neutral'
  status: 'unread' | 'read' | 'replied' | 'hidden'
  createdAt: string
}

interface Conversation {
  conversationId: string
  platform: string
  platformUsername: string
  platformProfileUrl?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: string
}

export function UnifiedInbox() {
  const [activeTab, setActiveTab] = useState<'messages' | 'comments'>('messages')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<PlatformMessage[]>([])
  const [comments, setComments] = useState<PlatformComment[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newReply, setNewReply] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
    fetchComments()
  }, [])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // Select first conversation if available
        if (data.conversations && data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0].conversationId)
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        await markAsRead(conversationId)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/comments', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId }),
      })
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.conversationId === conversationId 
            ? { ...conv, unreadCount: 0, status: 'read' }
            : conv
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const conversation = conversations.find(c => c.conversationId === selectedConversation)
      if (!conversation) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversation,
          platform: conversation.platform,
          content: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        toast.success('Message sent')
        // Refresh messages
        await fetchMessages(selectedConversation)
        await fetchConversations()
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const replyToComment = async (commentId: string) => {
    if (!newReply.trim()) return

    try {
      const response = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          commentId,
          content: newReply,
        }),
      })

      if (response.ok) {
        toast.success('Reply posted')
        setNewReply('')
        await fetchComments()
      } else {
        toast.error('Failed to post reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    }
  }

  // Filter conversations based on platform and status
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(conv => conv.platform === selectedPlatform)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.platformUsername?.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [conversations, selectedPlatform, statusFilter, searchQuery])

  // Filter comments based on platform
  const filteredComments = useMemo(() => {
    if (selectedPlatform === 'all') return comments
    return comments.filter(comment => comment.platform === selectedPlatform)
  }, [comments, selectedPlatform])

  const getSelectedConversation = () => {
    return conversations.find(c => c.conversationId === selectedConversation)
  }

  const getPlatformIcon = (platform: string) => {
    const Icon = PlatformIcons[platform] || MessageCircle
    return <Icon className="w-4 h-4" />
  }

  const getPlatformBadge = (platform: string) => {
    const Icon = PlatformIcons[platform] || MessageCircle
    const colorClass = PlatformColors[platform] || "bg-gray-500"
    
    return (
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white", colorClass)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unified Inbox</h1>
        <p className="text-gray-600">Manage all your social media messages and comments in one place</p>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPlatform === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('all')}
          >
            All Platforms
          </Button>
          <Button
            variant={selectedPlatform === 'facebook' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('facebook')}
          >
            <Facebook className="w-4 h-4 mr-1" />
            Facebook
          </Button>
          <Button
            variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('instagram')}
          >
            <Instagram className="w-4 h-4 mr-1" />
            Instagram
          </Button>
          <Button
            variant={selectedPlatform === 'messenger' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('messenger')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Messenger
          </Button>
          <Button
            variant={selectedPlatform === 'whatsapp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('whatsapp')}
          >
            <Phone className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('unread')}>
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              Unread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('replied')}>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Replied
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
              <Archive className="w-4 h-4 mr-2 text-gray-600" />
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
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
            {filteredComments.filter(c => c.status === 'unread').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filteredComments.filter(c => c.status === 'unread').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="p-4 flex flex-col h-full">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search conversations..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      onClick={() => setSelectedConversation(conversation.conversationId)}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedConversation === conversation.conversationId 
                          ? "bg-blue-50 border-l-4 border-blue-600" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.platformProfileUrl} />
                          <AvatarFallback>
                            {conversation.platformUsername?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          {getPlatformBadge(conversation.platform)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {conversation.platformUsername}
                          </h4>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.lastMessageTime 
                            ? new Date(conversation.lastMessageTime).toLocaleString() 
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={getSelectedConversation()?.platformProfileUrl} />
                            <AvatarFallback>
                              {getSelectedConversation()?.platformUsername?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {getSelectedConversation()?.platformUsername}
                            </h3>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              {getPlatformIcon(getSelectedConversation()?.platform || '')}
                              <span className="capitalize">{getSelectedConversation()?.platform}</span>
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
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Mark as spam
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
                            message.isIncoming ? "justify-start" : "justify-end"
                          )}
                        >
                          <div className="max-w-xs lg:max-w-md space-y-2">
                            <div
                              className={cn(
                                "px-4 py-3 rounded-2xl",
                                message.isIncoming 
                                  ? "bg-gray-100 text-gray-900" 
                                  : "bg-blue-600 text-white"
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className={cn(
                              "text-xs text-gray-500",
                              message.isIncoming ? "text-left" : "text-right"
                            )}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          disabled={sendingMessage}
                        />
                        <Button 
                          size="icon" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={sendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comments List */}
            <Card className="p-6">
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet</p>
                ) : (
                  filteredComments.map((comment) => (
                    <div key={comment.id} className="space-y-3 border-b pb-4 last:border-0">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage src={comment.platformProfileUrl} />
                          <AvatarFallback>
                            {comment.platformUsername?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {comment.platformUsername}
                              </h4>
                              {getPlatformBadge(comment.platform)}
                              {comment.status === 'unread' && (
                                <Badge variant="destructive" className="text-xs">New</Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                          
                          {/* Sentiment indicator */}
                          {comment.sentiment && (
                            <div className="flex items-center space-x-2 mt-2">
                              {comment.sentiment === 'positive' && (
                                <Badge variant="outline" className="text-green-600">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  Positive
                                </Badge>
                              )}
                              {comment.sentiment === 'negative' && (
                                <Badge variant="outline" className="text-red-600">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Negative
                                </Badge>
                              )}
                              {comment.sentiment === 'neutral' && (
                                <Badge variant="outline" className="text-gray-600">
                                  Neutral
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              Like
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Reply Section */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Reply to Comment</h3>
              <div className="space-y-4">
                <Textarea 
                  placeholder="Write your reply..." 
                  className="min-h-[120px]"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!newReply.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}