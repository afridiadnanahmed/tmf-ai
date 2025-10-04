"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Key, Settings, Eye, EyeOff, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  iconColor: string
  bgColor: string
  category: string
  requiresOAuth: boolean
  requiresApiKey?: boolean
  apiKeyFields?: Array<{
    name: string
    label: string
    type: 'text' | 'password' | 'select'
    placeholder?: string
    required?: boolean
    options?: Array<{ value: string; label: string }>
  }>
  status: 'connected' | 'disconnected'
  connectedAt?: string
  expiresAt?: string
  needsRefresh?: boolean
  hasOAuthConfigured?: boolean
}

interface OAuthCredentials {
  clientId: string
  clientSecret: string
  redirectUri?: string
  scopes?: string
}

interface IntegrationsScreenProps {
  message?: {
    type: 'error' | 'success'
    message: string
  } | null
}

export function IntegrationsScreen({ message }: IntegrationsScreenProps) {
  const [showAddPlatform, setShowAddPlatform] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showOAuthConfig, setShowOAuthConfig] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Integration | null>(null)
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({})
  const [oauthCredentials, setOAuthCredentials] = useState<OAuthCredentials>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: ''
  })
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [savingOAuth, setSavingOAuth] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Display message from props (OAuth callback messages)
  useEffect(() => {
    if (message) {
      toast({
        title: message.type === 'success' ? 'Success' : 'Connection Failed',
        description: message.message,
        variant: message.type === 'error' ? 'destructive' : 'default',
      })
      if (message.type === 'success') {
        fetchIntegrations()
      }
    }
  }, [message, toast])

  // Check for OAuth callback messages from URL (legacy support)
  useEffect(() => {
    const error = searchParams.get('error')
    const success = searchParams.get('success')

    if (error) {
      toast({
        title: "Connection failed",
        description: decodeURIComponent(error),
        variant: "destructive",
      })
      router.replace('/dashboard?tab=integrations')
    }

    if (success) {
      toast({
        title: "Success",
        description: decodeURIComponent(success),
      })
      router.replace('/dashboard?tab=integrations')
      fetchIntegrations()
    }
  }, [searchParams, router, toast])

  // Fetch integration status
  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/status')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  // Handle OAuth connection
  const handleOAuthConnect = async (platform: Integration) => {
    setConnecting(platform.id)
    try {
      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.id }),
      })
      
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      } else {
        const error = await response.json()
        
        // Check if OAuth app needs to be configured first
        if (error.requiresConfiguration) {
          toast({
            title: "OAuth App Required",
            description: "Please configure your OAuth app credentials for this platform in Settings → Integrations first.",
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings/integrations')}
              >
                Go to Settings
              </Button>
            ),
          })
        } else {
          toast({
            title: "Connection failed",
            description: error.error || "Failed to initiate connection",
            variant: "destructive",
          })
        }
        setConnecting(null)
      }
    } catch (error) {
      console.error('OAuth connect error:', error)
      toast({
        title: "Connection failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setConnecting(null)
    }
  }

  // Handle API key connection
  const handleApiKeyConnect = async () => {
    if (!selectedPlatform) return
    
    // Validate required fields
    const missingFields = selectedPlatform.apiKeyFields?.filter(
      field => field.required && !apiKeyValues[field.name]
    )
    
    if (missingFields && missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in all required fields`,
        variant: "destructive",
      })
      return
    }
    
    setConnecting(selectedPlatform.id)
    try {
      const response = await fetch('/api/integrations/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          credentials: apiKeyValues,
        }),
      })
      
      if (response.ok) {
        toast({
          title: "Connected successfully",
          description: `${selectedPlatform.name} has been connected`,
        })
        setShowApiKeyDialog(false)
        setApiKeyValues({})
        fetchIntegrations()
      } else {
        const error = await response.json()
        toast({
          title: "Connection failed",
          description: error.error || "Failed to connect with API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('API key connect error:', error)
      toast({
        title: "Connection failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  // Handle OAuth configuration save
  const handleSaveOAuthConfig = async (platformId: string, isUpdate: boolean = false) => {
    if (!oauthCredentials.clientId || !oauthCredentials.clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter both Client ID and Client Secret",
        variant: "destructive",
      })
      return
    }

    setSavingOAuth(platformId)
    try {
      // Check if this platform already has OAuth configuration
      const platform = integrations.find(p => p.id === platformId)
      const hasExistingConfig = platform?.hasOAuthConfigured

      let response;

      if (hasExistingConfig || isUpdate) {
        // Update existing OAuth configuration
        response = await fetch('/api/settings/oauth', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformId,
            ...oauthCredentials,
            scopes: oauthCredentials.scopes ? oauthCredentials.scopes.split(',').map(s => s.trim()) : []
          })
        })
      } else {
        // Create new OAuth configuration
        response = await fetch('/api/settings/oauth-apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformId,
            ...oauthCredentials,
            scopes: oauthCredentials.scopes ? oauthCredentials.scopes.split(',').map(s => s.trim()) : []
          })
        })
      }

      if (response.ok) {
        toast({
          title: hasExistingConfig ? "OAuth app updated" : "OAuth app configured",
          description: "You can now connect to this platform",
        })
        setShowOAuthConfig(null)
        setOAuthCredentials({ clientId: '', clientSecret: '', redirectUri: '', scopes: '' })
        fetchIntegrations() // Refresh to show hasOAuthConfigured status
      } else {
        const error = await response.json()
        toast({
          title: "Failed to save",
          description: error.error || "Failed to save OAuth configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSavingOAuth(null)
    }
  }

  // Handle platform click
  const handlePlatformClick = (platform: Integration) => {
    if (platform.requiresApiKey) {
      setSelectedPlatform(platform)
      setApiKeyValues({})
      setShowApiKeyDialog(true)
    } else if (platform.requiresOAuth) {
      if (platform.hasOAuthConfigured) {
        handleOAuthConnect(platform)
      } else {
        // Show OAuth configuration inline
        setShowOAuthConfig(platform.id)
        setOAuthCredentials({ clientId: '', clientSecret: '', redirectUri: '', scopes: '' })
      }
    }
  }

  // Handle disconnect
  const handleDisconnect = async (platform: Integration) => {
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.id }),
      })
      
      if (response.ok) {
        toast({
          title: "Disconnected",
          description: `${platform.name} has been disconnected`,
        })
        fetchIntegrations()
      } else {
        toast({
          title: "Disconnect failed",
          description: "Failed to disconnect integration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: "Disconnect failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const connectedPlatforms = integrations.filter(p => p.status === 'connected')
  const configuredButDisconnected = integrations.filter(p =>
    p.status === 'disconnected' && p.hasOAuthConfigured === true
  )
  const availablePlatforms = integrations.filter(p =>
    p.status === 'disconnected' && !p.hasOAuthConfigured
  )

  // Helper function to group platforms by category
  const groupByCategory = (platforms: Integration[]) => {
    return platforms.reduce((acc, platform) => {
      if (!acc[platform.category]) {
        acc[platform.category] = []
      }
      acc[platform.category].push(platform)
      return acc
    }, {} as Record<string, Integration[]>)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Integrations</h1>
          <p className="text-gray-600">Connect your marketing platforms to centralize your data and insights</p>
        </div>
        <Button onClick={() => setShowAddPlatform(true)} style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }} className="hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="connected">
            Connected ({connectedPlatforms.length})
          </TabsTrigger>
          <TabsTrigger value="disconnected">
            Disconnected ({configuredButDisconnected.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availablePlatforms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="mt-6">
          {connectedPlatforms.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connected integrations</h3>
              <p className="text-gray-600 mb-4">Connect your first platform to get started</p>
              <Button onClick={() => setShowAddPlatform(true)} style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }} className="hover:opacity-90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Platform
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupByCategory(connectedPlatforms)).map(([category, platforms]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform) => (
                <Card key={platform.id} className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                          <span className={`text-lg ${platform.iconColor}`}>{platform.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">Connected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                    {platform.connectedAt && (
                      <p className="text-xs text-gray-500 mb-2">
                        Connected: {new Date(platform.connectedAt).toLocaleDateString()}
                      </p>
                    )}
                    {platform.needsRefresh && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 rounded">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-800">Token expired, reconnect required</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {/* View Configuration button for connected platforms */}
                      {platform.hasOAuthConfigured && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            setShowOAuthConfig(platform.id);
                            // Fetch existing OAuth config
                            try {
                              const response = await fetch(`/api/settings/oauth?platform=${platform.id}`);
                              if (response.ok) {
                                const data = await response.json();
                                if (data) {
                                  setOAuthCredentials({
                                    clientId: data.clientId || '',
                                    clientSecret: '', // Don't populate for security
                                    redirectUri: data.redirectUri || '',
                                    scopes: data.scopes ? data.scopes.join(', ') : ''
                                  });
                                }
                              } else {
                                // No existing config or error, use empty values
                                setOAuthCredentials({
                                  clientId: '',
                                  clientSecret: '',
                                  redirectUri: '',
                                  scopes: ''
                                });
                              }
                            } catch (error) {
                              console.error('Error fetching OAuth config:', error);
                              setOAuthCredentials({
                                clientId: '',
                                clientSecret: '',
                                redirectUri: '',
                                scopes: ''
                              });
                            }
                          }}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Config
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDisconnect(platform)}
                      >
                        Disconnect
                      </Button>
                      {platform.needsRefresh && (
                        <Button
                          size="sm"
                          style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                          className="flex-1 hover:opacity-90 text-white"
                          onClick={() => handlePlatformClick(platform)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reconnect
                        </Button>
                      )}
                    </div>

                    {/* OAuth Configuration Display - Read-only for connected platforms */}
                    {platform.requiresOAuth && showOAuthConfig === platform.id && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">OAuth Configuration</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowOAuthConfig(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs text-green-800">
                            ✓ OAuth is configured for this platform
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">
                            Redirect URI: <code className="bg-white px-1 rounded text-xs">{window.location.origin}/api/integrations/callback</code>
                          </p>
                        </div>

                        {oauthCredentials.clientId && (
                          <div className="space-y-2 text-xs text-gray-600">
                            <p><strong>Client ID:</strong> {oauthCredentials.clientId}</p>
                            <p><strong>Client Secret:</strong> ••••••••• (hidden for security)</p>
                            {oauthCredentials.scopes && (
                              <p><strong>Scopes:</strong> {oauthCredentials.scopes}</p>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 italic">
                          <p>To update credentials, disconnect and reconfigure.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="disconnected" className="mt-6">
          {configuredButDisconnected.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No disconnected platforms</h3>
              <p className="text-gray-600">All configured platforms are currently connected</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupByCategory(configuredButDisconnected)).map(([category, platforms]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform) => (
                <Card key={platform.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                          <span className={`text-lg ${platform.iconColor}`}>{platform.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                          {platform.requiresOAuth && !platform.hasOAuthConfigured ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              Setup required
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              Not connected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                    
                    {/* OAuth Configuration Section for Disconnected - Editable */}
                    {platform.requiresOAuth && showOAuthConfig === platform.id && (
                      <div className="border-t pt-4 mb-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">Edit OAuth Configuration</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowOAuthConfig(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Update credentials below or delete to reconfigure from scratch
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">
                            Redirect URI: <code className="bg-white px-1 rounded text-xs">{window.location.origin}/api/integrations/callback</code>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`${platform.id}-edit-client-id`} className="text-xs">
                              Client ID *
                            </Label>
                            <Input
                              id={`${platform.id}-edit-client-id`}
                              className="h-8 text-sm"
                              placeholder="Loading existing Client ID..."
                              value={oauthCredentials.clientId}
                              onChange={(e) => setOAuthCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Currently shows existing value</p>
                          </div>

                          <div>
                            <Label htmlFor={`${platform.id}-edit-client-secret`} className="text-xs">
                              Client Secret *
                            </Label>
                            <div className="relative">
                              <Input
                                id={`${platform.id}-edit-client-secret`}
                                className="h-8 text-sm pr-8"
                                type={showSecrets[platform.id] ? "text" : "password"}
                                placeholder="Enter new secret (leave empty to keep current)"
                                value={oauthCredentials.clientSecret}
                                onChange={(e) => setOAuthCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-1 top-1 h-6 w-6 p-0"
                                onClick={() => setShowSecrets(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                              >
                                {showSecrets[platform.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">For security, enter only if you want to change it</p>
                          </div>

                          <div>
                            <Label htmlFor={`${platform.id}-edit-scopes`} className="text-xs">
                              Scopes (optional)
                            </Label>
                            <Input
                              id={`${platform.id}-edit-scopes`}
                              className="h-8 text-sm"
                              placeholder="e.g., email, profile (comma-separated)"
                              value={oauthCredentials.scopes}
                              onChange={(e) => setOAuthCredentials(prev => ({ ...prev, scopes: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete the OAuth configuration? You will need to reconfigure it to connect again.')) {
                                try {
                                  const response = await fetch('/api/settings/oauth', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ platform: platform.id })
                                  });

                                  if (response.ok) {
                                    toast({
                                      title: "Configuration deleted",
                                      description: "OAuth configuration has been removed",
                                    });
                                    setShowOAuthConfig(null);
                                    fetchIntegrations(); // Refresh the list
                                  } else {
                                    throw new Error('Failed to delete configuration');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete OAuth configuration",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleSaveOAuthConfig(platform.id, true)}
                            disabled={savingOAuth === platform.id}
                          >
                            {savingOAuth === platform.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Settings className="w-3 h-3 mr-1" />
                                Update Config
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                            className="flex-1 hover:opacity-90 text-white"
                            onClick={() => {
                              if (oauthCredentials.clientId || oauthCredentials.clientSecret) {
                                // If credentials were modified, save them first then reconnect
                                handleSaveOAuthConfig(platform.id, true).then(() => {
                                  handlePlatformClick(platform);
                                });
                              } else {
                                // No changes, just reconnect
                                setShowOAuthConfig(null);
                                handlePlatformClick(platform);
                              }
                            }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Save & Reconnect
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Buttons for disconnected platforms - only show when config panel is closed */}
                    {showOAuthConfig !== platform.id && (
                      <div className="flex gap-2">
                        {/* Edit Configuration button */}
                        {platform.hasOAuthConfigured && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={async () => {
                              setShowOAuthConfig(platform.id);
                              // Fetch existing OAuth config
                              try {
                                const response = await fetch(`/api/settings/oauth?platform=${platform.id}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data) {
                                    setOAuthCredentials({
                                      clientId: data.clientId || '',
                                      clientSecret: '', // Don't populate for security
                                      redirectUri: data.redirectUri || '',
                                      scopes: data.scopes ? data.scopes.join(', ') : ''
                                    });
                                  }
                                } else {
                                  // No existing config or error, use empty values
                                  setOAuthCredentials({
                                    clientId: '',
                                    clientSecret: '',
                                    redirectUri: '',
                                    scopes: ''
                                  });
                                }
                              } catch (error) {
                                console.error('Error fetching OAuth config:', error);
                                setOAuthCredentials({
                                  clientId: '',
                                  clientSecret: '',
                                  redirectUri: '',
                                  scopes: ''
                                });
                              }
                            }}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Edit Config
                          </Button>
                        )}

                        {/* Reconnect button */}
                        {platform.hasOAuthConfigured && (
                          <Button
                            size="sm"
                            style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                            className="flex-1 hover:opacity-90 text-white"
                            onClick={() => handlePlatformClick(platform)}
                            disabled={connecting === platform.id}
                          >
                            {connecting === platform.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reconnect
                              </>
                            )}
                          </Button>
                        )}

                        {/* Configure OAuth button for platforms without config */}
                        {platform.requiresOAuth && !platform.hasOAuthConfigured && (
                          <Button
                            size="sm"
                            style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                            className="w-full hover:opacity-90 text-white"
                            onClick={() => setShowOAuthConfig(platform.id)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure OAuth
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          {availablePlatforms.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All platforms configured!</h3>
              <p className="text-gray-600">You've configured all available platforms</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupByCategory(availablePlatforms)).map(([category, platforms]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform) => (
                <Card key={platform.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                          <span className={`text-lg ${platform.iconColor}`}>{platform.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Not configured
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                    {/* OAuth Configuration Section for Available platforms */}
                    {platform.requiresOAuth && (
                      <Button
                        size="sm"
                        style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                        className="w-full hover:opacity-90 text-white"
                        onClick={() => {
                          setSelectedPlatform(platform)
                          setShowOAuthConfig(platform.id)
                          setOAuthCredentials({
                            clientId: '',
                            clientSecret: '',
                            redirectUri: '',
                            scopes: ''
                          })
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Configure OAuth
                      </Button>
                    )}

                    {platform.requiresApiKey && (
                      <Button
                        size="sm"
                        style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
                        className="w-full hover:opacity-90 text-white"
                        onClick={() => handlePlatformClick(platform)}
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Add API Key
                      </Button>
                    )}

                    {/* OAuth Config Dialog for this platform */}
                    {platform.requiresOAuth && showOAuthConfig === platform.id && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">OAuth Configuration</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowOAuthConfig(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">
                            Redirect URI: <code className="bg-white px-1 rounded">{window.location.origin}/api/integrations/callback</code>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`${platform.id}-client-id`} className="text-xs">
                              Client ID *
                            </Label>
                            <Input
                              id={`${platform.id}-client-id`}
                              className="h-8 text-sm"
                              placeholder="Enter Client ID"
                              value={oauthCredentials.clientId}
                              onChange={(e) => setOAuthCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`${platform.id}-client-secret`} className="text-xs">
                              Client Secret *
                            </Label>
                            <div className="relative">
                              <Input
                                id={`${platform.id}-client-secret`}
                                className="h-8 text-sm pr-8"
                                type={showSecrets[platform.id] ? "text" : "password"}
                                placeholder="Enter Client Secret"
                                value={oauthCredentials.clientSecret}
                                onChange={(e) => setOAuthCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-1 top-1 h-6 w-6 p-0"
                                onClick={() => setShowSecrets(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                              >
                                {showSecrets[platform.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`${platform.id}-scopes`} className="text-xs">
                              Scopes (optional)
                            </Label>
                            <Input
                              id={`${platform.id}-scopes`}
                              className="h-8 text-sm"
                              placeholder="e.g., email, profile (comma-separated)"
                              value={oauthCredentials.scopes}
                              onChange={(e) => setOAuthCredentials(prev => ({ ...prev, scopes: e.target.value }))}
                            />
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleSaveOAuthConfig(platform.id)}
                            disabled={!oauthCredentials.clientId || !oauthCredentials.clientSecret || savingOAuth === platform.id}
                          >
                            {savingOAuth === platform.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                Save & Connect
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Platform Modal */}
      <Dialog open={showAddPlatform} onOpenChange={setShowAddPlatform}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Available Integrations</DialogTitle>
            <DialogDescription>
              Choose a platform to connect and start syncing your data
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-8">
            {Object.entries(
              [...configuredButDisconnected, ...availablePlatforms].reduce((acc, platform) => {
                if (!acc[platform.category]) {
                  acc[platform.category] = []
                }
                acc[platform.category].push(platform)
                return acc
              }, {} as Record<string, Integration[]>)
            ).map(([category, platforms]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {platforms.map((platform: Integration) => (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setShowAddPlatform(false)
                        handlePlatformClick(platform)
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                          <span className={`text-sm ${platform.iconColor}`}>{platform.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{platform.name}</h4>
                          <p className="text-xs text-gray-600">
                            {platform.requiresApiKey ? 'API Key' : 'OAuth Authentication'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedPlatform?.name} credentials to connect your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedPlatform?.apiKeyFields?.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'select' ? (
                  <Select
                    value={apiKeyValues[field.name] || ''}
                    onValueChange={(value) => 
                      setApiKeyValues(prev => ({ ...prev, [field.name]: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={apiKeyValues[field.name] || ''}
                    onChange={(e) => 
                      setApiKeyValues(prev => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="mt-1"
                  />
                )}
              </div>
            ))}

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You can find these credentials in your {selectedPlatform?.name} account settings.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApiKeyDialog(false)
                setApiKeyValues({})
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApiKeyConnect}
              disabled={connecting === selectedPlatform?.id}
              style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
              className="hover:opacity-90 text-white"
            >
              {connecting === selectedPlatform?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}