"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, X, Upload, Plus } from "lucide-react"
import { toast } from "sonner"

interface Post {
  id: string
  content: string
  platform: string
  image: string | null
  scheduledAt: string | null
  status: string
  createdAt: string
}

interface Integration {
  id: string
  platform: string
  name: string
  icon: string
  status: string
}

export function PostSchedulerScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showEditPost, setShowEditPost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().getDate())
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0, scheduled: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [connectedPlatforms, setConnectedPlatforms] = useState<Integration[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    content: "",
    platform: "",
    image: null as File | null,
    scheduledDate: "",
    scheduledTime: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    content: "",
    platform: "",
    image: null as File | null,
    scheduledDate: "",
    scheduledTime: "",
    existingImage: null as string | null,
  })
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const currentMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"]
  const weekDaysFull = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Fetch connected platforms
  useEffect(() => {
    const fetchConnectedPlatforms = async () => {
      try {
        const response = await fetch('/api/integrations/status')
        if (response.ok) {
          const data = await response.json()
          const connected = data.integrations
            .filter((integration: any) => integration.status === 'connected')
            .map((integration: any) => ({
              id: integration.id,
              platform: integration.id,
              name: integration.name,
              icon: integration.icon,
              status: integration.status
            }))
          setConnectedPlatforms(connected)
        }
      } catch (error) {
        console.error('Failed to fetch connected platforms:', error)
      }
    }

    fetchConnectedPlatforms()
  }, [])

  // Fetch posts
  useEffect(() => {
    fetchPosts()
  }, [currentDate, statusFilter])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()

      // When filtering drafts, don't apply date range to get all drafts including those without scheduled time
      let url = `/api/posts?startDate=${startDate}&endDate=${endDate}`
      if (statusFilter === 'draft') {
        url = `/api/posts?status=draft`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setStats(data.stats || { total: 0, completed: 0, scheduled: 0, draft: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setFormData({ ...formData, image: file })

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreatePost = async (postType: 'schedule' | 'draft' | 'now' = 'schedule') => {
    if (!formData.content || !formData.platform) {
      toast.error('Please fill in content and select a platform')
      return
    }

    if (postType === 'schedule' && (!formData.scheduledDate || !formData.scheduledTime)) {
      toast.error('Please select a date and time to schedule the post')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = null

      if (formData.image) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', formData.image)

        const uploadResponse = await fetch('/api/user/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.imageUrl
        } else {
          toast.error('Failed to upload image')
          return
        }
      }

      let scheduledAt = null
      let status = 'draft'

      if (postType === 'now') {
        // Set scheduled time to now for immediate posting
        scheduledAt = new Date().toISOString()
        status = 'scheduled'
      } else if (postType === 'schedule') {
        scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
        status = 'scheduled'
      } else {
        // draft - check if date and time are provided
        if (formData.scheduledDate && formData.scheduledTime) {
          scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
        }
        status = 'draft'
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: formData.content,
          platform: formData.platform,
          image: imageUrl,
          scheduledAt,
          status,
        }),
      })

      if (response.ok) {
        const messages = {
          now: 'Post is being published now',
          schedule: 'Post scheduled successfully',
          draft: 'Draft saved successfully'
        }
        toast.success(messages[postType])
        setShowCreatePost(false)
        resetForm()
        fetchPosts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('An error occurred while creating the post')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      content: "",
      platform: "",
      image: null,
      scheduledDate: "",
      scheduledTime: "",
    })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)

    // Parse the scheduled date and time
    let dateStr = ""
    let timeStr = ""
    if (post.scheduledAt) {
      const schedDate = new Date(post.scheduledAt)
      dateStr = schedDate.toISOString().split('T')[0]
      timeStr = schedDate.toTimeString().slice(0, 5)
    }

    setEditFormData({
      content: post.content,
      platform: post.platform,
      image: null,
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      existingImage: post.image,
    })
    setEditImagePreview(post.image)
    setShowEditPost(true)
  }

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setEditFormData({ ...editFormData, image: file, existingImage: null })

    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdatePost = async (saveAsDraft: boolean = false) => {
    if (!editingPost || !editFormData.content || !editFormData.platform) {
      toast.error('Please fill in content and select a platform')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = editFormData.existingImage

      // Upload new image if present
      if (editFormData.image) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', editFormData.image)

        const uploadResponse = await fetch('/api/user/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.imageUrl
        } else {
          toast.error('Failed to upload image')
          return
        }
      }

      // Handle optional scheduled date/time for drafts
      let scheduledAt = null
      if (editFormData.scheduledDate && editFormData.scheduledTime) {
        scheduledAt = new Date(`${editFormData.scheduledDate}T${editFormData.scheduledTime}`).toISOString()
      }

      // Determine status: if saving as draft, keep as draft
      // If updating post with date/time, change to scheduled
      let status = editingPost.status
      if (saveAsDraft) {
        status = 'draft'
      } else if (scheduledAt && editingPost.status === 'draft') {
        // If draft has date/time and "Update Post" is clicked, change to scheduled
        status = 'scheduled'
      }

      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: editingPost.id,
          content: editFormData.content,
          platform: editFormData.platform,
          image: imageUrl,
          scheduledAt,
          status,
        }),
      })

      if (response.ok) {
        toast.success(saveAsDraft ? 'Draft saved successfully' : 'Post updated successfully')
        setShowEditPost(false)
        setEditingPost(null)
        fetchPosts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update post')
      }
    } catch (error) {
      console.error('Failed to update post:', error)
      toast.error('An error occurred while updating the post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!editingPost) return

    if (!confirm('Are you sure you want to delete this post?')) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/posts?id=${editingPost.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Post deleted successfully')
        setShowEditPost(false)
        setEditingPost(null)
        fetchPosts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('An error occurred while deleting the post')
    } finally {
      setSubmitting(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getPostsForDate = (date: number) => {
    return posts.filter(post => {
      // Drafts without scheduled date should not appear in calendar views
      if (!post.scheduledAt) return false

      const postDate = new Date(post.scheduledAt)
      const matchesDate = postDate.getDate() === date &&
             postDate.getMonth() === currentDate.getMonth() &&
             postDate.getFullYear() === currentDate.getFullYear()

      // Apply status filter
      if (statusFilter === 'all') return matchesDate
      return matchesDate && post.status === statusFilter
    })
  }

  const getPostsForWeekday = (weekdayOffset: number) => {
    // Create a date object for the selected date
    const selectedFullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)

    // Get the start of the week for the selected date
    const startOfWeek = new Date(selectedFullDate)
    startOfWeek.setDate(selectedFullDate.getDate() - selectedFullDate.getDay() + weekdayOffset + 1)

    return posts.filter(post => {
      // Drafts without scheduled date should not appear in calendar views
      if (!post.scheduledAt) return false

      const postDate = new Date(post.scheduledAt)
      const matchesDate = postDate.toDateString() === startOfWeek.toDateString()

      // Apply status filter
      if (statusFilter === 'all') return matchesDate
      return matchesDate && post.status === statusFilter
    })
  }

  const getWeekDates = () => {
    const dates = []
    // Create a date object for the selected date
    const selectedFullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)

    // Get the start of the week for the selected date
    const startOfWeek = new Date(selectedFullDate)
    startOfWeek.setDate(selectedFullDate.getDate() - selectedFullDate.getDay() + 1)

    for (let i = 0; i < 6; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date.getDate())
    }
    return dates
  }

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      facebook: "📘",
      instagram: "📷",
      twitter: "🐦",
      linkedin: "💼",
      youtube: "📺",
      google: "🔍",
      shopify: "🛍️",
    }
    return icons[platform] || "📱"
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Post Scheduler</h1>
          <p className="text-gray-600 dark:text-gray-400">Create, schedule, and manage your social media posts</p>
        </div>
        <Button
          onClick={() => setShowCreatePost(true)}
          style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
          className="hover:opacity-90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'all'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={statusFilter === 'all' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
        >
          All Posts
        </button>
        <button
          onClick={() => setStatusFilter('scheduled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'scheduled'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={statusFilter === 'scheduled' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
        >
          Scheduled
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'published'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={statusFilter === 'published' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
        >
          Published
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'draft'
              ? 'text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={statusFilter === 'draft' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
        >
          Drafts
        </button>
      </div>

      {/* Stats Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #459AFF 0%, #9F8BF9 100%)' }}></div>
          <CardContent className="p-4 pl-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #459AFF 0%, #9F8BF9 100%)' }}></div>
          <CardContent className="p-4 pl-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Post</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #459AFF 0%, #9F8BF9 100%)' }}></div>
          <CardContent className="p-4 pl-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.scheduled}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #459AFF 0%, #9F8BF9 100%)' }}></div>
          <CardContent className="p-4 pl-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.draft}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Out of Scheduled</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar - Left Side */}
        <div className="lg:col-span-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{currentMonth}</h3>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDaysShort.map((day, index) => (
                <div key={`weekday-${index}`} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2 rounded" style={{ background: '#F9F7FD' }}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayPosts = getPostsForDate(day)
                const isSelected = day === selectedDate
                const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear()

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg transition-colors ${
                      isSelected
                        ? "text-white"
                        : isToday
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    style={isSelected ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
                  >
                    <span>{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayPosts.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-blue-500'
                            }`}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Posts Grid - Right Side */}
        <div className="lg:col-span-8">
          {/* View Toggle */}
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={viewMode === 'week' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'day'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={viewMode === 'day' ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
              >
                Day View
              </button>
            </div>
          </div>

          {/* Show drafts without scheduled time in a separate section */}
          {statusFilter === 'draft' && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Drafts Without Scheduled Time
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading drafts...</div>
              ) : posts.filter(p => p.status === 'draft' && !p.scheduledAt).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No drafts without scheduled time</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.filter(p => p.status === 'draft' && !p.scheduledAt).map((post) => (
                    <Card
                      key={post.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow opacity-60 border-2 border-dashed border-gray-400 dark:border-gray-600"
                      onClick={() => handleEditPost(post)}
                    >
                      <CardContent className="p-0">
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post"
                            className="w-full h-32 rounded-lg object-cover mb-3"
                          />
                        )}
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-medium">
                            DRAFT
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          {viewMode === 'week' ? (
            <>
              {/* Week Days Header */}
              <div className="grid grid-cols-6 gap-4 mb-4">
                {weekDaysFull.map((day, index) => {
                  const weekDates = getWeekDates()
                  return (
                    <div key={day} className="text-center p-3 rounded-lg" style={{ background: '#F9F7FD' }}>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{day}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{weekDates[index]}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {getPostsForWeekday(index).length} Post{getPostsForWeekday(index).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-6 gap-4">
                {weekDaysFull.map((_, weekdayIndex) => {
                  const dayPosts = getPostsForWeekday(weekdayIndex)

                  return (
                    <div key={weekdayIndex} className={`space-y-3 ${weekdayIndex !== 5 ? 'border-r border-gray-200 dark:border-gray-700 pr-4' : ''}`}>
                      {dayPosts.map((post) => (
                        <Card
                          key={post.id}
                          className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative ${
                            post.status === 'draft' ? 'opacity-60 border-2 border-dashed border-gray-400 dark:border-gray-600' : ''
                          }`}
                          onClick={() => handleEditPost(post)}
                        >
                          <CardContent className="p-0">
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post"
                                className="w-full h-20 object-cover"
                              />
                            )}
                            <div className="p-2">
                              {post.status === 'draft' && (
                                <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                                  DRAFT
                                </span>
                              )}
                              <p className="text-xs text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {post.scheduledAt ? formatTime(post.scheduledAt) : 'No time'}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{getPlatformIcon(post.platform)}</span>
                                <span className={`text-xs font-medium ${
                                  post.status === 'published' ? 'text-green-600 dark:text-green-400' :
                                  post.status === 'scheduled' ? 'text-blue-600 dark:text-blue-400' :
                                  post.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                                  'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {post.status}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Posts for {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
              </h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading posts...</div>
              ) : getPostsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No posts scheduled for this day</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPostsForDate(selectedDate).map((post) => (
                    <Card
                      key={post.id}
                      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        post.status === 'draft' ? 'opacity-60 border-2 border-dashed border-gray-400 dark:border-gray-600' : ''
                      }`}
                      onClick={() => handleEditPost(post)}
                    >
                      <CardContent className="p-0">
                        {post.status === 'draft' && (
                          <span className="inline-block px-2 py-1 mb-2 text-xs font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                            DRAFT
                          </span>
                        )}
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post"
                            className="w-full h-32 rounded-lg object-cover mb-3"
                          />
                        )}
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{post.scheduledAt ? formatTime(post.scheduledAt) : 'No time'}</span>
                          <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-[10px] font-medium ${
                            post.status === 'published' ? 'text-green-600 dark:text-green-400' :
                            post.status === 'scheduled' ? 'text-blue-600 dark:text-blue-400' :
                            post.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={(open) => {
        setShowCreatePost(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Post</DialogTitle>
            <p className="text-gray-600 dark:text-gray-400">Schedule a new post for your social media platforms</p>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Content</label>
              <Textarea
                placeholder="What's on your mind?"
                className="min-h-[100px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image</label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setImagePreview(null)
                      setFormData({ ...formData, image: null })
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload Image</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Choose a file or drag it here</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedPlatforms.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No connected platforms
                      </div>
                    ) : (
                      connectedPlatforms.map((platform) => (
                        <SelectItem key={platform.platform} value={platform.platform}>
                          <span className="flex items-center gap-2">
                            <span>{platform.icon}</span>
                            {platform.name}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <div className="flex space-x-3">
                <Button
                  style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                  className="flex-1 hover:opacity-90 text-white"
                  onClick={() => handleCreatePost('schedule')}
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Post'}
                </Button>
                <Button
                  style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                  className="flex-1 hover:opacity-90 text-white"
                  onClick={() => handleCreatePost('now')}
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Post Now'}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleCreatePost('draft')}
                disabled={submitting}
              >
                Save Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={showEditPost} onOpenChange={(open) => {
        setShowEditPost(open)
        if (!open) setEditingPost(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Edit Post</DialogTitle>
                <p className="text-gray-600 dark:text-gray-400">Update your scheduled post</p>
              </div>
              {editingPost && (
                <span className={`text-sm font-medium mt-8 ${
                  editingPost.status === 'published' ? 'text-green-600 dark:text-green-400' :
                  editingPost.status === 'scheduled' ? 'text-blue-600 dark:text-blue-400' :
                  editingPost.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {editingPost.status}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Content</label>
              <Textarea
                placeholder="What's on your mind?"
                className="min-h-[100px]"
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image</label>
              {editImagePreview ? (
                <div className="relative">
                  <img src={editImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setEditImagePreview(null)
                      setEditFormData({ ...editFormData, image: null, existingImage: null })
                      if (editFileInputRef.current) editFileInputRef.current.value = ''
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload Image</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Choose a file or drag it here</p>
                </div>
              )}
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleEditImageSelect}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</label>
                <Select value={editFormData.platform} onValueChange={(value) => setEditFormData({ ...editFormData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedPlatforms.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No connected platforms
                      </div>
                    ) : (
                      connectedPlatforms.map((platform) => (
                        <SelectItem key={platform.platform} value={platform.platform}>
                          <span className="flex items-center gap-2">
                            <span>{platform.icon}</span>
                            {platform.name}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <Input
                  type="date"
                  value={editFormData.scheduledDate}
                  onChange={(e) => setEditFormData({ ...editFormData, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
              <Input
                type="time"
                value={editFormData.scheduledTime}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledTime: e.target.value })}
              />
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <div className="flex space-x-3">
                <Button
                  style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                  className="flex-1 hover:opacity-90 text-white"
                  onClick={() => handleUpdatePost(false)}
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Post'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeletePost}
                  disabled={submitting}
                >
                  Delete
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleUpdatePost(true)}
                disabled={submitting}
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
