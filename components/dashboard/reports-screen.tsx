"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"

export function ReportsScreen() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [platform, setPlatform] = useState("all")

  const reportData = [
    {
      metric: "Total Impressions",
      value: "2,456,789",
      change: "+12.5%",
      trend: "up",
      color: "text-blue-600",
    },
    {
      metric: "Total Clicks",
      value: "45,678",
      change: "+8.3%",
      trend: "up",
      color: "text-green-600",
    },
    {
      metric: "Click-Through Rate",
      value: "1.86%",
      change: "-2.1%",
      trend: "down",
      color: "text-red-600",
    },
    {
      metric: "Cost Per Click",
      value: "$2.34",
      change: "+5.7%",
      trend: "up",
      color: "text-orange-600",
    },
    {
      metric: "Conversions",
      value: "1,234",
      change: "+15.2%",
      trend: "up",
      color: "text-purple-600",
    },
    {
      metric: "Conversion Rate",
      value: "2.7%",
      change: "+3.4%",
      trend: "up",
      color: "text-teal-600",
    },
  ]

  const campaignPerformance = [
    {
      campaign: "Summer Sale 2024",
      platform: "Google Ads",
      impressions: "456,789",
      clicks: "12,345",
      conversions: "234",
      spend: "$2,345",
      roas: "4.2x",
    },
    {
      campaign: "Black Friday Prep",
      platform: "Meta Ads",
      impressions: "234,567",
      clicks: "8,901",
      conversions: "156",
      spend: "$1,890",
      roas: "3.8x",
    },
    {
      campaign: "Product Launch",
      platform: "LinkedIn",
      impressions: "123,456",
      clicks: "4,567",
      conversions: "89",
      spend: "$1,234",
      roas: "2.9x",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and performance insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-90-days">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="google-ads">Google Ads</SelectItem>
              <SelectItem value="meta-ads">Meta Ads</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportData.map((metric, index) => (
          <Card key={index} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.metric}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <div className="flex items-center mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 800 300" className="w-full h-full">
              {/* Grid lines */}
              <defs>
                <pattern id="reportGrid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#reportGrid)" />

              {/* Chart areas */}
              <path
                d="M 50 250 Q 150 200 250 180 T 450 160 T 650 140 T 750 120 L 750 280 L 50 280 Z"
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <path
                d="M 50 220 Q 150 180 250 160 T 450 140 T 650 120 T 750 100 L 750 280 L 50 280 Z"
                fill="rgba(236, 72, 153, 0.1)"
                stroke="#ec4899"
                strokeWidth="2"
              />
              <path
                d="M 50 200 Q 150 160 250 140 T 450 120 T 650 100 T 750 80 L 750 280 L 50 280 Z"
                fill="rgba(20, 184, 166, 0.1)"
                stroke="#14b8a6"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="flex justify-between mt-4 text-sm text-gray-600">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Impressions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Clicks</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Conversions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance Table */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-lg font-semibold">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Campaign</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Platform</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Impressions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Clicks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Conversions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Spend</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((campaign, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{campaign.campaign}</td>
                    <td className="py-3 px-4 text-gray-600">{campaign.platform}</td>
                    <td className="py-3 px-4 text-gray-900">{campaign.impressions}</td>
                    <td className="py-3 px-4 text-gray-900">{campaign.clicks}</td>
                    <td className="py-3 px-4 text-gray-900">{campaign.conversions}</td>
                    <td className="py-3 px-4 text-gray-900">{campaign.spend}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {campaign.roas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
