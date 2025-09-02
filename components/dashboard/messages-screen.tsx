"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Search, MoreHorizontal } from "lucide-react"

export function MessagesScreen() {
  const [selectedConversation, setSelectedConversation] = useState(0)
  const [newMessage, setNewMessage] = useState("")

  const conversations = [
    {
      id: 1,
      name: "Sophia",
      lastMessage:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      unread: true,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "William",
      lastMessage: "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at.",
      time: "5:30 pm",
      unread: true,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Amelia",
      lastMessage: "Lorem ipsum dolor sit amet consectetur.",
      time: "5:30 pm",
      unread: true,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Henry",
      lastMessage: "Lorem ipsum dolor sit amet consectetur.",
      time: "5:30 pm",
      unread: false,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "Arif",
      lastMessage: "Lorem ipsum dolor sit amet consectetur.",
      time: "5:30 pm",
      unread: false,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 6,
      name: "Evelyn",
      lastMessage: "Lorem ipsum dolor sit amet consectetur.",
      time: "5:30 pm",
      unread: false,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 7,
      name: "Oliver",
      lastMessage: "Lorem ipsum dolor sit amet consectetur.",
      time: "5:30 pm",
      unread: false,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const comments = [
    {
      id: 1,
      name: "Ariana",
      comment:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Mike Chen",
      comment:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Zoran",
      comment:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const messages = [
    {
      id: 1,
      sender: "Sophia",
      message:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      isOwn: false,
    },
    {
      id: 2,
      sender: "You",
      message:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut.",
      time: "5:30 pm",
      isOwn: true,
    },
    {
      id: 3,
      sender: "Sophia",
      message:
        "Lorem ipsum dolor sit amet consectetur. Diam sed rhoncus ante sit amet sed at. Enim ut elit donec nibh vitae mauris pulvinar vel ut. Orci cursus tincidunt dis tortor tempor pharetra suspendisse.",
      time: "5:30 pm",
      isOwn: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages & Comments</h1>
        <p className="text-gray-600">Stay connected with your audience across all platforms</p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Messages List */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Messages</h3>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search" className="pl-10" />
              </div>

              <div className="space-y-2">
                {conversations.map((conversation, index) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(index)}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer ${
                      selectedConversation === index ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={conversation.avatar || "/placeholder.svg"}
                      alt={conversation.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{conversation.name}</h4>
                        {conversation.unread && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{conversation.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">{conversation.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src="/placeholder.svg?height=40&width=40" alt="Sophia" className="w-10 h-10 rounded-full" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Sophia</h3>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md space-y-2`}>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <p className={`text-xs ${message.isOwn ? "text-right" : "text-left"} text-gray-500`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type here"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          setNewMessage("")
                        }
                      }}
                    />
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 rounded-full">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Comments</h3>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.avatar || "/placeholder.svg"}
                        alt={comment.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{comment.name}</h4>
                          <span className="text-xs text-gray-500">{comment.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.comment}</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-blue-600 hover:text-blue-700 p-0">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Reply to Comment</h3>
              <div className="space-y-4">
                <Textarea placeholder="Write your reply..." className="min-h-[120px]" />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
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
