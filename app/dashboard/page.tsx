"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Calendar, LogOut, MessageSquare, Settings, Users, Zap, DollarSign, MousePointerClick, Target, TrendingUp, Filter, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Header } from "@/components/common/header"
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
  const [oauthMessage, setOauthMessage] = useState<{ type: 'error' | 'success', message: string } | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<Array<{ id: string; name: string; icon: string }>>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [campaignData, setCampaignData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  // Check URL parameters for tab and messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const error = params.get('error')
    const success = params.get('success')

    // Set the active tab from URL parameter
    if (tab && ['dashboard', 'integrations', 'crm', 'scheduler', 'messages', 'reports', 'settings'].includes(tab)) {
      setActiveTab(tab as Tab)
    }

    // Show error or success messages if present
    if (error) {
      console.error('OAuth error:', decodeURIComponent(error))
      setOauthMessage({ type: 'error', message: decodeURIComponent(error) })
      // Clear the URL parameters
      window.history.replaceState({}, '', '/dashboard?tab=integrations')
    }
    if (success) {
      console.log('OAuth success:', decodeURIComponent(success))
      setOauthMessage({ type: 'success', message: decodeURIComponent(success) })
      // Clear the URL parameters
      window.history.replaceState({}, '', '/dashboard?tab=integrations')
    }
  }, [])

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
              name: integration.name,
              icon: integration.icon
            }))
          setConnectedPlatforms(connected)
          // Select all platforms by default
          setSelectedPlatforms(connected.map((p: any) => p.id))
        }
      } catch (error) {
        console.error('Failed to fetch connected platforms:', error)
      }
    }

    if (user) {
      fetchConnectedPlatforms()
    }
  }, [user])

  // Fetch campaign data when selected platforms change
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!user || selectedPlatforms.length === 0) {
        setLoadingData(false)
        return
      }

      setLoadingData(true)
      try {
        const platformsParam = selectedPlatforms.join(',')
        const response = await fetch(`/api/campaigns?platforms=${platformsParam}`)
        if (response.ok) {
          const data = await response.json()
          setCampaignData(data)
        }
      } catch (error) {
        console.error('Failed to fetch campaign data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchCampaignData()
  }, [user, selectedPlatforms])

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

  // Handle platform filter toggle
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  /* ───────────────────────────────── DASHBOARD OVERVIEW ─────────────────────────────── */
  // Get data from campaignData or use defaults
  const chartData = campaignData?.monthlyData || []
  const campaigns = campaignData?.campaigns || []
  const metrics = campaignData?.metrics || {
    totalSpend: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalImpressions: 0,
  }

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's your marketing performance at a glance.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Total Ad Spend</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {loadingData ? '...' : `$${metrics.totalSpend.toLocaleString()}`}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {loadingData ? '...' : metrics.totalClicks.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Conversions</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {loadingData ? '...' : metrics.totalConversions.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Total Impressions</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {loadingData ? '...' : `${(metrics.totalImpressions / 1000000).toFixed(1)}M`}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign performance chart */}
      <Card className="p-6 border-0 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Campaign performance</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Spend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-600">Clicks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-gray-600">Conversions</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Filter
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {connectedPlatforms.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No connected platforms
                    </div>
                  ) : (
                    connectedPlatforms.map((platform) => (
                      <DropdownMenuCheckboxItem
                        key={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                      >
                        <span className="mr-2">{platform.icon}</span>
                        {platform.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => `${value / 1000}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#A78BFA"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#F87171"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* General Campaign Overview Table - Exclude Shopify */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Overview</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Filter
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {connectedPlatforms.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    No connected platforms
                  </div>
                ) : (
                  connectedPlatforms.map((platform) => (
                    <DropdownMenuCheckboxItem
                      key={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    >
                      <span className="mr-2">{platform.icon}</span>
                      {platform.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Campaign Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Platform</TableHead>
                <TableHead className="font-semibold text-gray-700">Spend</TableHead>
                <TableHead className="font-semibold text-gray-700">Clicks</TableHead>
                <TableHead className="font-semibold text-gray-700">Conversions</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingData ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : campaigns.filter((c: any) => c.platform !== 'shopify').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No campaigns found. Connect platforms and add campaigns to see data here.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.filter((campaign: any) => campaign.platform !== 'shopify').map((campaign: any, index: number) => (
                  <TableRow key={campaign.id || index}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="capitalize">{campaign.platform}</TableCell>
                    <TableCell>${parseFloat(campaign.spend || '0').toFixed(2)}</TableCell>
                    <TableCell>{campaign.clicks?.toLocaleString() || 0}</TableCell>
                    <TableCell>{campaign.conversions?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          campaign.status === 'active'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : campaign.status === 'paused'
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }
                      >
                        {campaign.status || 'Delivered'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shopify E-commerce Chart - Only show when Shopify is selected */}
      {selectedPlatforms.includes('shopify') && campaigns.some(c => c.platform === 'shopify') && (
        <Card className="p-6 border-0 shadow-sm">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Shopify E-commerce Performance</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}></div>
                  <span className="text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Orders</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              const shopifyCampaign = campaigns.find(c => c.platform === 'shopify');
              const revenue = shopifyCampaign?.revenue || 0;
              const orders = shopifyCampaign?.conversions || 0;
              const avgOrderValue = shopifyCampaign?.metadata?.avgOrderValue || 0;

              // Use real monthly breakdown data from Shopify if available
              const shopifyMonthlyData = shopifyCampaign?.metadata?.monthlyBreakdown || Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                return {
                  month: date.toLocaleString('default', { month: 'short' }),
                  revenue: 0,
                  orders: 0,
                };
              });

              return (
                <>
                  {/* Shopify Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{orders.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold text-gray-900">${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {/* Shopify Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={shopifyMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.96)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`$${value}`, 'Revenue'];
                          return [value, 'Orders'];
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="url(#colorGradient)"
                        strokeWidth={3}
                        dot={{ fill: '#459AFF', r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#459AFF" />
                          <stop offset="100%" stopColor="#9F8BF9" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Shopify Overview Table */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Shopify Overview</h3>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700">Store</TableHead>
                          <TableHead className="font-semibold text-gray-700">Total Revenue</TableHead>
                          <TableHead className="font-semibold text-gray-700">Total Orders</TableHead>
                          <TableHead className="font-semibold text-gray-700">Avg Order Value</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{shopifyCampaign?.name || 'Shopify Store'}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{orders.toLocaleString()}</TableCell>
                          <TableCell>${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}
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
      <Header user={user} setActiveTab={setActiveTab} setIsLogoutOpen={setIsLogoutOpen} />

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
                  activeTab === item.key ? "text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
                style={activeTab === item.key ? { background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' } : {}}
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
          {activeTab === "integrations" && <IntegrationsScreen message={oauthMessage} />}
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
