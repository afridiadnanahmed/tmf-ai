"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus } from "lucide-react"

export function IntegrationsScreen() {
  const [showAddPlatform, setShowAddPlatform] = useState(false)
  const [integrations, setIntegrations] = useState({
    metaAds: true,
    googleAds: true,
    googleAnalytics: true,
    tikTok: false,
    linkedin: false,
    youtube: false,
  })

  const toggleIntegration = (key: string) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const connectedPlatforms = [
    {
      id: "metaAds",
      name: "Meta Ads",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "∞",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      status: "Connected",
      active: integrations.metaAds,
    },
    {
      id: "googleAds",
      name: "Google Ads",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "△",
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      status: "Connected",
      active: integrations.googleAds,
    },
    {
      id: "googleAnalytics",
      name: "Google Analytics",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "📊",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      status: "Connected",
      active: integrations.googleAnalytics,
    },
  ]

  const disconnectedPlatforms = [
    {
      id: "tikTok",
      name: "Tik Tok",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🎵",
      iconColor: "text-black",
      bgColor: "bg-gray-100",
      status: "Disconnected",
      active: integrations.tikTok,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "💼",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100",
      status: "Disconnected",
      active: integrations.linkedin,
    },
    {
      id: "youtube",
      name: "YouTube",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "📺",
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      status: "Disconnected",
      active: integrations.youtube,
    },
  ]

  const additionalPlatforms = [
    {
      name: "Hotjar",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🔥",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      name: "SendGrid",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "📧",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Brevo",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🟢",
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Mailchimp",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🐵",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "HubSpot",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🔶",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      name: "Magento",
      description: "Connect your Google Ads account to track campaign performance and optimize spending",
      icon: "🛒",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Integrations</h1>
          <p className="text-gray-600">Connect your marketing platforms to centralize your data and insights</p>
        </div>
        <Button onClick={() => setShowAddPlatform(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="disconnected">Disconnected</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedPlatforms.map((platform) => (
              <Card key={platform.id} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                        <span className={`text-lg ${platform.iconColor}`}>{platform.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {platform.status}
                        </span>
                      </div>
                    </div>
                    <Switch checked={platform.active} onCheckedChange={() => toggleIntegration(platform.id)} />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    View Integration
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="disconnected" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disconnectedPlatforms.map((platform) => (
              <Card key={platform.id} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                        <span className={`text-lg ${platform.iconColor}`}>{platform.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          {platform.status}
                        </span>
                      </div>
                    </div>
                    <Switch checked={platform.active} onCheckedChange={() => toggleIntegration(platform.id)} />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    View Integration
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Platform Modal */}
      <Dialog open={showAddPlatform} onOpenChange={setShowAddPlatform}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Add Platform</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddPlatform(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {additionalPlatforms.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                    <span className={`text-sm ${platform.iconColor}`}>{platform.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{platform.name}</h4>
                    <p className="text-xs text-gray-600">{platform.description}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Add
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
