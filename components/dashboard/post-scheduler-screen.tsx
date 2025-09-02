"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, X, Upload, Plus } from "lucide-react"

export function PostSchedulerScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [currentMonth, setCurrentMonth] = useState("February 2025")
  const [selectedDate, setSelectedDate] = useState(14)

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dates = [12, 13, 14, 15, 16, 17]

  const scheduledPosts = {
    14: [
      {
        id: 1,
        title: "Lorem ipsum",
        time: "10:00 AM",
        platforms: ["facebook", "instagram"],
        image: "/placeholder.svg?height=60&width=60",
      },
      {
        id: 2,
        title: "Lorem ipsum",
        time: "2:00 PM",
        platforms: ["twitter"],
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    15: [
      {
        id: 3,
        title: "Lorem ipsum",
        time: "9:00 AM",
        platforms: ["linkedin"],
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    16: [
      {
        id: 4,
        title: "Lorem ipsum",
        time: "11:00 AM",
        platforms: ["facebook", "instagram", "twitter"],
        image: "/placeholder.svg?height=60&width=60",
      },
      {
        id: 5,
        title: "Lorem ipsum",
        time: "3:00 PM",
        platforms: ["youtube"],
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
  }

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"]

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: "📘",
      instagram: "📷",
      twitter: "🐦",
      linkedin: "💼",
      youtube: "📺",
    }
    return icons[platform as keyof typeof icons] || "📱"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Scheduler</h1>
          <p className="text-gray-600">Create, schedule, and manage your social media posts</p>
        </div>
        <Button onClick={() => setShowCreatePost(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">14</div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">24</div>
          <div className="text-sm text-gray-600">Total Post</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">10</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">9</div>
          <div className="text-sm text-gray-600">Out of Scheduled</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-gray-900">{currentMonth}</h3>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDaysShort.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg hover:bg-gray-100 ${
                  day === selectedDate ? "bg-blue-600 text-white" : "text-gray-900"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </Card>

        {/* Weekly View */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {weekDays.map((day, index) => (
              <div key={day} className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">{day}</div>
                <div className="text-lg font-bold text-gray-900">{dates[index]}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-4">
            {dates.map((date) => (
              <div key={date} className="space-y-2">
                {scheduledPosts[date as keyof typeof scheduledPosts]?.map((post) => (
                  <Card key={post.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="space-y-2">
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-16 rounded object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-medium text-gray-900 truncate">{post.title}</h4>
                          <p className="text-xs text-gray-600">{post.time}</p>
                          <div className="flex space-x-1 mt-1">
                            {post.platforms.map((platform) => (
                              <span key={platform} className="text-xs">
                                {getPlatformIcon(platform)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Create New Post</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreatePost(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600">Schedule a new post for your social media platforms</p>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
              <Textarea placeholder="What's on your mind?" className="min-h-[100px]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload Image</p>
                <p className="text-xs text-gray-500">Choose a file or drag it here</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <Input type="date" placeholder="mm/dd/yyyy" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <Input type="time" placeholder="hh:mm" />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Schedule Post</Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Save Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
