"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BarChart3, Bell, Calendar, ChevronDown, LogOut, MessageSquare, Settings, Users, Zap } from "lucide-react"
import { useAuth, getUserInitials } from "@/lib/auth-context"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Filter } from "lucide-react"

import { IntegrationsScreen } from "@/components/dashboard/integrations-screen"
import { CRMScreen } from "@/components/dashboard/crm-screen"
import { PostSchedulerScreen } from "@/components/dashboard/post-scheduler-screen"
import { MessagesScreen } from "@/components/dashboard/messages-screen"
import { ReportsScreen } from "@/components/dashboard/reports-screen"
import { SettingsScreen } from "@/components/dashboard/settings-screen"

type Tab = "dashboard" | "integrations" | "crm" | "scheduler" | "messages" | "reports" | "settings"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Handle logout
  const handleLogout = async () => {
    setIsLogoutOpen(false)
    await logout()
  }

  /* ───────────────────────────────── DASHBOARD OVERVIEW ─────────────────────────────── */
  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your marketing performance at a glance.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Ad Spend", value: "40,689", color: "green" },
          { label: "Total Clicks", value: "1,280", color: "blue" },
          { label: "Conversions", value: "3,420", color: "teal" },
          { label: "Impressions", value: "2.1 M", color: "purple" },
        ].map((stat) => (
          <Card key={stat.label} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5 % this month
                  </p>
                </div>
                <div className={`w-8 h-8 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <div className={`w-4 h-4 bg-${stat.color}-600 rounded`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dummy campaign performance placeholder */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Campaign performance</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-40 w-full bg-gray-100 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 text-sm">Chart placeholder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  /* ────────────────────────────────────────── RENDER ────────────────────────────────── */
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="The Meta Future" width={120} height={40} priority />
          </Link>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open notifications">
                  <Bell className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-64">
                <DropdownMenuItem className="font-medium">No new notifications</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user ? getUserInitials(user.name) : ''}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setActiveTab("settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => setIsLogoutOpen(true)}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
          <nav className="p-6 space-y-2">
            {[
              { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
              { key: "integrations", label: "Integrations", icon: <Zap className="w-5 h-5" /> },
              { key: "crm", label: "CRM", icon: <Users className="w-5 h-5" /> },
              { key: "scheduler", label: "Post Scheduler", icon: <Calendar className="w-5 h-5" /> },
              { key: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" /> },
              { key: "reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
              { key: "settings", label: "Setting", icon: <Settings className="w-5 h-5" /> },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as Tab)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                  activeTab === item.key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 mt-8"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "dashboard" && renderDashboardOverview()}
          {activeTab === "integrations" && <IntegrationsScreen />}
          {activeTab === "crm" && <CRMScreen />}
          {activeTab === "scheduler" && <PostSchedulerScreen />}
          {activeTab === "messages" && <MessagesScreen />}
          {activeTab === "reports" && <ReportsScreen />}
          {activeTab === "settings" && <SettingsScreen />}
        </main>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-6">Are you sure you want to log out? You’ll be returned to the home page.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
