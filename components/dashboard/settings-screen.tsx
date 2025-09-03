"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronRight, User, Bell, Palette, Lock, Upload, X } from "lucide-react"
import { useAuth, getUserInitials } from "@/lib/auth-context"
import { toast } from "sonner"

export function SettingsScreen() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    weeklyReports: true,
    campaignUpdates: true,
  })

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    image: user?.image || "",
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        image: user.image || "",
      })
    }
  }, [user])
  
  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/user/settings', {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.notifications) {
            setNotifications({
              emailAlerts: data.settings.notifications.emailAlerts,
              pushNotifications: data.settings.notifications.pushNotifications,
              weeklyReports: data.settings.notifications.weeklyReports,
              campaignUpdates: data.settings.notifications.campaignUpdates,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    
    loadSettings()
  }, [])

  const handleNotificationChange = async (key: string) => {
    // Optimistically update UI
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key as keyof typeof notifications],
    }
    setNotifications(newNotifications)
    
    // Save to database
    setNotificationsLoading(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notifications: newNotifications
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Revert on error
        setNotifications(notifications)
        toast.error(data.error || 'Failed to update notification settings')
      } else {
        toast.success('Notification preferences updated')
      }
    } catch (error) {
      // Revert on error
      setNotifications(notifications)
      toast.error('An error occurred while updating settings')
    } finally {
      setNotificationsLoading(false)
    }
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }
    
    // Validate file size (1MB)
    const maxSize = 1 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size must be less than 1MB')
      return
    }
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // Auto upload
    handleImageUpload(file)
  }
  
  const handleImageUpload = async (file: File) => {
    setImageLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/user/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Profile photo updated successfully')
        // Update local state
        setProfile(prev => ({ ...prev, image: data.imageUrl }))
        // Refresh user context
        await refreshUser()
        // Clear preview
        setImagePreview(null)
      } else {
        toast.error(data.error || 'Failed to upload image')
        setImagePreview(null)
      }
    } catch (error) {
      toast.error('An error occurred while uploading image')
      setImagePreview(null)
    } finally {
      setImageLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  const handleRemoveImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profile),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Profile updated successfully')
        // Update user context with fresh data
        await refreshUser()
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handlePasswordChange = async () => {
    
    // Validate all fields are filled
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setPasswordLoading(true)
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      
      const data = await response.json()
      console.log('Password change response:', response.status, data)
      
      if (response.ok) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        console.error('Password change failed:', data)
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('An error occurred while changing password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notification Preferences</span>
            <span className="sm:hidden">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Themes</span>
            <span className="sm:hidden">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={imagePreview || profile.image || undefined} />
                    <AvatarFallback className="text-lg bg-blue-600 text-white">
                      {user ? getUserInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={imageLoading}
                      onClick={(e) => {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }}
                    >
                      {imageLoading ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </Button>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF or WebP. Max 1MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-4 pb-4 border-t border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <Input
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                    {(passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) && (
                      <div className="flex justify-end">
                        <Button 
                          className="bg-green-600 hover:bg-green-700" 
                          onClick={handlePasswordChange}
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Changing...' : 'Change Password'}
                        </Button>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => setProfile({
                      name: user?.name || "",
                      email: user?.email || "",
                      image: user?.image || "",
                    })}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={handleProfileUpdate}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Alerts</h4>
                    <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={() => handleNotificationChange("emailAlerts")}
                    disabled={notificationsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Get push notifications on your device</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={() => handleNotificationChange("pushNotifications")}
                    disabled={notificationsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                    <p className="text-sm text-gray-500">Receive weekly performance reports</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={() => handleNotificationChange("weeklyReports")}
                    disabled={notificationsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Campaign Updates</h4>
                    <p className="text-sm text-gray-500">Get notified about campaign status changes</p>
                  </div>
                  <Switch
                    checked={notifications.campaignUpdates}
                    onCheckedChange={() => handleNotificationChange("campaignUpdates")}
                    disabled={notificationsLoading}
                  />
                </div>
              </div>

              {notificationsLoading && (
                <div className="text-sm text-gray-500 text-center">
                  Saving notification preferences...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Themes</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-blue-500 rounded-lg p-4 cursor-pointer">
                  <div className="text-center">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3"></div>
                    <h4 className="font-medium text-gray-900">Light Theme</h4>
                    <p className="text-sm text-gray-500">Clean and bright interface</p>
                  </div>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
                  <div className="text-center">
                    <div className="w-full h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-3"></div>
                    <h4 className="font-medium text-gray-900">Dark Theme</h4>
                    <p className="text-sm text-gray-500">Easy on the eyes</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline">Reset to Default</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Apply Theme</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Security</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Login Notifications</h4>
                    <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Session Management</h4>
                    <p className="text-sm text-gray-500">Manage active sessions and devices</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Current Session</p>
                      <p className="text-sm text-gray-500">Chrome on Windows • New York, NY</p>
                    </div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Mobile App</p>
                      <p className="text-sm text-gray-500">iPhone • Last seen 2 hours ago</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline">Export Data</Button>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
