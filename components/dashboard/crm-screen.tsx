"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Filter, TrendingUp, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CRMScreen() {
  const [leads] = useState([
    {
      id: 1,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
    {
      id: 2,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
    {
      id: 3,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
    {
      id: 4,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
    {
      id: 5,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
    {
      id: 6,
      name: "Lorem ipsum",
      contact: "+1 (555) 123-4567",
      source: "Google Ads",
      campaign: "Summer Sale",
      status: "New",
      value: "Lorem ipsum",
      date: "2024-01-15",
    },
  ])

  const [showAddLead, setShowAddLead] = useState(false)

  const handleExport = () => {
    // Create CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Contact,Source,Campaign,Status,Value,Date\n" +
      leads
        .map(
          (lead) =>
            `${lead.name},${lead.contact},${lead.source},${lead.campaign},${lead.status},${lead.value},${lead.date}`,
        )
        .join("\n")

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "leads_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CRM Dashboard</h1>
          <p className="text-gray-600">Manage your leads and customer relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }} className="hover:opacity-90 text-white" onClick={() => setShowAddLead(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900">40,689</p>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-2xl font-bold text-gray-900">1280</p>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Qualified</p>
            <p className="text-2xl font-bold text-gray-900">40,689</p>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">40,689</p>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </p>
          </div>
        </Card>
      </div>

      {/* Leads Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Leads Overview</h3>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{lead.name}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.contact}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.source}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.campaign}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{lead.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{lead.value}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.date}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <Input placeholder="Enter lead name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
              <Input placeholder="Enter contact information" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google-ads">Google Ads</SelectItem>
                  <SelectItem value="meta-ads">Meta Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
              <Input placeholder="Enter campaign name" />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }} className="flex-1 hover:opacity-90 text-white">Add Lead</Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowAddLead(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
