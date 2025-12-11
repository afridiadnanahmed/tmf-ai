"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Filter, TrendingUp, Plus, RefreshCw, Loader2, ChevronLeft, ChevronRight, Upload, Download, Check, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  value?: number
  currency?: string
  status: string
  source: string
  platform: string
  createdAt: Date
}

interface LeadStats {
  total: number
  new: number
  qualified: number
  converted: number
}

interface Pagination {
  page: number
  limit: number
  totalLeads: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function CRMScreen() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats>({ total: 0, new: 0, qualified: 0, converted: 0 })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalLeads: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [showAddLead, setShowAddLead] = useState(false)
  const [submittingLead, setSubmittingLead] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showExportDialog, setShowExportDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New',
    source: '',
    value: '',
    currency: 'USD'
  })

  // Fetch leads on component mount and when page or platform changes
  useEffect(() => {
    fetchLeads(pagination.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, selectedPlatform])

  const fetchLeads = async (page?: number) => {
    try {
      setLoading(true)
      const currentPage = page || pagination.page
      const platformParam = selectedPlatform !== 'all' ? `&platform=${selectedPlatform}` : ''
      const response = await fetch(`/api/crm/leads?page=${currentPage}&limit=${pagination.limit}${platformParam}`)

      if (response.ok) {
        const data = await response.json()
        setAllLeads(data.leads || [])
        setLeads(data.leads || [])
        setStats(data.stats || { total: 0, new: 0, qualified: 0, converted: 0 })
        setConnectedPlatforms(data.platforms || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        toast.error('Failed to load CRM leads')
      }
    } catch (error) {
      console.error('Failed to fetch CRM leads:', error)
      toast.error('An error occurred while loading leads')
    } finally {
      setLoading(false)
    }
  }

  // Filter leads based on search query
  const filteredLeads = searchQuery.trim() === ''
    ? leads
    : allLeads.filter(lead => {
        const query = searchQuery.toLowerCase()
        return (
          lead.name.toLowerCase().includes(query) ||
          (lead.email && lead.email.toLowerCase().includes(query)) ||
          (lead.phone && lead.phone.toLowerCase().includes(query)) ||
          (lead.company && lead.company.toLowerCase().includes(query))
        )
      })

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeads()
    setRefreshing(false)
    toast.success('Leads refreshed successfully')
  }

  const handleSync = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/crm/leads?sync=true')

      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
        setStats(data.stats || { total: 0, new: 0, qualified: 0, converted: 0 })
        toast.success('Leads synced to database successfully')
      } else {
        toast.error('Failed to sync leads')
      }
    } catch (error) {
      console.error('Failed to sync leads:', error)
      toast.error('An error occurred while syncing leads')
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = (exportType: 'all' | 'page' | 'selected') => {
    let leadsToExport: Lead[] = []

    switch (exportType) {
      case 'all':
        leadsToExport = allLeads
        break
      case 'page':
        leadsToExport = filteredLeads
        break
      case 'selected':
        leadsToExport = allLeads.filter(lead => selectedLeads.has(lead.id))
        break
    }

    if (leadsToExport.length === 0) {
      toast.error('No leads to export')
      return
    }

    // Create CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Phone,Company,Source,Platform,Status,Value,Date\n" +
      leadsToExport
        .map(
          (lead) =>
            `${lead.name},${lead.email || ''},${lead.phone || ''},${lead.company || ''},${lead.source},${lead.platform},${lead.status},${lead.value || ''},${new Date(lead.createdAt).toLocaleDateString()}`,
        )
        .join("\n")

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `crm_leads_${exportType}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDialog(false)
    toast.success(`${leadsToExport.length} leads exported successfully`)
  }

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)))
    }
  }

  const formatValue = (value?: number, currency?: string) => {
    if (!value) return '-'
    return `${currency || '$'}${value.toLocaleString()}`
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      salesforce: '☁️',
      hubspot: '🔶',
      zohoCRM: '📋',
      pipedrive: '🎯',
      dynamics365: '🔷',
      freshsales: '🌿',
      manual: '✏️',
      imported: '📥',
    }
    return icons[platform] || '📊'
  }

  const getPlatformDisplayName = (platform: string) => {
    const names: Record<string, string> = {
      salesforce: 'Salesforce',
      hubspot: 'HubSpot',
      zohoCRM: 'Zoho CRM',
      pipedrive: 'Pipedrive',
      dynamics365: 'Dynamics 365',
      freshsales: 'Freshsales',
      manual: 'Manual Entry',
      imported: 'Imported',
    }
    return names[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
  }

  const handlePlatformFilter = (platform: string) => {
    setSelectedPlatform(platform)
    // Reset to page 1 when changing filter
    setPagination({ ...pagination, page: 1 })
  }

  const handleAddLead = async () => {
    if (!newLead.name.trim()) {
      toast.error('Please enter a name for the lead')
      return
    }

    try {
      setSubmittingLead(true)
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLead.name,
          email: newLead.email || undefined,
          phone: newLead.phone || undefined,
          company: newLead.company || undefined,
          status: newLead.status,
          source: newLead.source || undefined,
          value: newLead.value ? parseFloat(newLead.value) : undefined,
          currency: newLead.currency,
        }),
      })

      if (response.ok) {
        toast.success('Lead added successfully')
        setShowAddLead(false)
        // Reset form
        setNewLead({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'New',
          source: '',
          value: '',
          currency: 'USD'
        })
        // Refresh leads list
        await fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add lead')
      }
    } catch (error) {
      console.error('Failed to add lead:', error)
      toast.error('An error occurred while adding the lead')
    } finally {
      setSubmittingLead(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please upload a CSV or Excel file')
        return
      }
      setImportFile(file)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const leads: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const lead: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        lead[header] = value
      })

      leads.push(lead)
    }

    return leads
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import')
      return
    }

    try {
      setImporting(true)
      const fileText = await importFile.text()
      const parsedLeads = parseCSV(fileText)

      if (parsedLeads.length === 0) {
        toast.error('No valid data found in file')
        return
      }

      const response = await fetch('/api/crm/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: parsedLeads }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)

        if (data.results.errors.length > 0) {
          console.warn('Import errors:', data.results.errors)
          toast.warning(`${data.results.failed} leads failed to import. Check console for details.`)
        }

        setShowImport(false)
        setImportFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Refresh leads list
        await fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to import leads')
      }
    } catch (error) {
      console.error('Failed to import leads:', error)
      toast.error('An error occurred while importing leads')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'name,email,phone,company,status,source,value,currency\nJohn Doe,john@example.com,+1234567890,Acme Inc,New,Website,5000,USD\nJane Smith,jane@example.com,+0987654321,Tech Corp,Qualified,Referral,10000,USD'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leads_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CRM Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {connectedPlatforms.length > 0
              ? `Connected to: ${connectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}`
              : 'Manage your leads and customer relationships'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sync to DB
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)} disabled={leads.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.total.toLocaleString()}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
              From all platforms
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Leads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.new.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
              {stats.total > 0 ? `${Math.round((stats.new / stats.total) * 100)}%` : '0%'} of total
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qualified</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.qualified.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
              {stats.total > 0 ? `${Math.round((stats.qualified / stats.total) * 100)}%` : '0%'} of total
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Converted</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.converted.toLocaleString()}</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}%` : '0%'} conversion
            </p>
          </div>
        </Card>
      </div>

      {/* Leads Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leads Overview</h3>
            {selectedPlatform !== 'all' && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filtered by: {getPlatformDisplayName(selectedPlatform)}
              </span>
            )}
            {selectedLeads.size > 0 && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {selectedLeads.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Platform
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select Platform</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedPlatform === 'all'}
                onCheckedChange={() => handlePlatformFilter('all')}
              >
                {selectedPlatform === 'all' && <Check className="w-4 h-4 mr-2" />}
                All Platforms
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {/* Filter out manual and imported from connected platforms to avoid duplicates */}
              {connectedPlatforms.filter(p => p !== 'manual' && p !== 'imported').length > 0 && (
                <>
                  {connectedPlatforms.filter(p => p !== 'manual' && p !== 'imported').map((platform) => (
                    <DropdownMenuCheckboxItem
                      key={platform}
                      checked={selectedPlatform === platform}
                      onCheckedChange={() => handlePlatformFilter(platform)}
                    >
                      <span className="mr-2">{getPlatformIcon(platform)}</span>
                      {getPlatformDisplayName(platform)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Always show manual and imported options */}
              <DropdownMenuCheckboxItem
                checked={selectedPlatform === 'manual'}
                onCheckedChange={() => handlePlatformFilter('manual')}
              >
                <span className="mr-2">{getPlatformIcon('manual')}</span>
                {getPlatformDisplayName('manual')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedPlatform === 'imported'}
                onCheckedChange={() => handlePlatformFilter('imported')}
              >
                <span className="mr-2">{getPlatformIcon('imported')}</span>
                {getPlatformDisplayName('imported')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No leads match your search' : 'No leads found'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Connect a CRM platform in the Integrations tab to start importing leads'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size > 0 && selectedLeads.size === filteredLeads.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Platform</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-lg" title={lead.platform}>
                        {getPlatformIcon(lead.platform)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{lead.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{lead.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{lead.phone || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{lead.company || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{formatValue(lead.value, lead.currency)}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Search Results Counter */}
          {searchQuery && filteredLeads.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}

          {/* Pagination Controls */}
          {!searchQuery && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalLeads)} of {pagination.totalLeads} leads
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                        disabled={loading}
                        className={pagination.page === pageNum ? "bg-gradient-to-r from-[#459AFF] to-[#9F8BF9] text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
        )}
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
              <Input
                placeholder="Enter lead name"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
              <Input
                placeholder="Enter company name"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <Select value={newLead.status} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                <Input
                  placeholder="e.g. Google Ads"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newLead.value}
                  onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <Select value={newLead.currency} onValueChange={(value) => setNewLead({ ...newLead, currency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                className="flex-1 hover:opacity-90 text-white"
                onClick={handleAddLead}
                disabled={submittingLead}
              >
                {submittingLead ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add Lead
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowAddLead(false)} disabled={submittingLead}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Leads Modal */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import leads into your CRM
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {importFile ? importFile.name : 'Choose a file or drag it here'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    CSV or Excel files only
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>CSV Format:</strong> name, email, phone, company, status, source, value, currency
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 dark:text-blue-400"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                className="flex-1 hover:opacity-90 text-white"
                onClick={handleImport}
                disabled={importing || !importFile}
              >
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Import Leads
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setShowImport(false)
                  setImportFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Export Leads</DialogTitle>
            <DialogDescription>
              Choose what leads you want to export to CSV
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4"
              onClick={() => handleExport('all')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-base">Export All Leads</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Export all {allLeads.length} leads from all pages
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4"
              onClick={() => handleExport('page')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-base">Export Current Page</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Export {filteredLeads.length} leads from this page
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4"
              onClick={() => handleExport('selected')}
              disabled={selectedLeads.size === 0}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-base">Export Selected Leads</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLeads.size === 0
                    ? 'No leads selected'
                    : `Export ${selectedLeads.size} selected lead${selectedLeads.size !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
