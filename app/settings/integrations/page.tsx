'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PLATFORMS } from '@/lib/integrations/all-platforms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Edit, Trash2, Plus, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface OAuthApp {
  id: string;
  platform: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function IntegrationSettingsPage() {
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<OAuthApp | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: ''
  });

  useEffect(() => {
    fetchOAuthApps();
  }, []);

  const fetchOAuthApps = async () => {
    try {
      const response = await fetch('/api/settings/oauth-apps');
      if (response.ok) {
        const data = await response.json();
        setOauthApps(data.apps || []);
      }
    } catch (error) {
      toast.error('Failed to load OAuth apps');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingApp ? 'PUT' : 'POST';
      const url = editingApp 
        ? `/api/settings/oauth-apps/${editingApp.id}`
        : '/api/settings/oauth-apps';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          ...formData,
          scopes: formData.scopes ? formData.scopes.split(',').map(s => s.trim()) : []
        })
      });

      if (response.ok) {
        toast.success(editingApp ? 'OAuth app updated' : 'OAuth app created');
        fetchOAuthApps();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save OAuth app');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this OAuth app?')) return;
    
    try {
      const response = await fetch(`/api/settings/oauth-apps/${appId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('OAuth app deleted');
        fetchOAuthApps();
      } else {
        toast.error('Failed to delete OAuth app');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleEdit = (app: OAuthApp) => {
    setEditingApp(app);
    setSelectedPlatform(app.platform);
    setFormData({
      clientId: app.clientId,
      clientSecret: app.clientSecret || '',
      redirectUri: app.redirectUri || '',
      scopes: app.scopes?.join(', ') || ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingApp(null);
    setSelectedPlatform('');
    setFormData({
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scopes: ''
    });
  };

  const toggleSecretVisibility = (appId: string) => {
    setShowSecrets(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId);
  };

  const getRedirectUri = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/integrations/callback`;
    }
    return '';
  };

  const oauthPlatforms = PLATFORMS.filter(p => p.requiresOAuth);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integration Settings</h1>
        <p className="text-gray-600">
          Configure OAuth applications for your integrations
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          To connect platforms like Facebook, Google, LinkedIn etc., you need to create OAuth apps
          on their respective developer portals and add the credentials here.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>OAuth Applications</CardTitle>
              <CardDescription>
                Manage OAuth credentials for different platforms
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add OAuth App
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : oauthApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No OAuth apps configured. Add one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {oauthApps.map((app) => {
                const platform = getPlatformInfo(app.platform);
                return (
                  <div 
                    key={app.id} 
                    className="border rounded-lg p-4 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {platform && (
                          <div className={`w-10 h-10 rounded-lg ${platform.bgColor} flex items-center justify-center`}>
                            <span className={`text-xl ${platform.iconColor}`}>
                              {platform.icon}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {platform?.name || app.platform}
                          </h3>
                          <Badge variant={app.isActive ? "default" : "secondary"}>
                            {app.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Client ID:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded">
                            {app.clientId}
                          </code>
                        </div>
                        
                        {app.clientSecret && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Client Secret:</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded">
                              {showSecrets[app.id] 
                                ? app.clientSecret 
                                : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSecretVisibility(app.id)}
                            >
                              {showSecrets[app.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {app.redirectUri && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Redirect URI:</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {app.redirectUri}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(app)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingApp ? 'Edit OAuth App' : 'Add OAuth App'}
            </DialogTitle>
            <DialogDescription>
              Configure OAuth credentials for platform integration
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Platform</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                required
                disabled={!!editingApp}
              >
                <option value="">Select a platform</option>
                {oauthPlatforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlatform && (
              <>
                <Alert>
                  <AlertDescription>
                    <strong>Redirect URI:</strong>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {getRedirectUri()}
                    </code>
                    <br />
                    <span className="text-sm text-gray-600 mt-1 block">
                      Add this URI to the "Authorized redirect URIs" in your {getPlatformInfo(selectedPlatform)?.name} OAuth settings
                    </span>
                    {selectedPlatform.includes('google') && (
                      <div className="mt-2 pt-2 border-t text-xs">
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        <strong>Google Setup:</strong> In Google Cloud Console, ensure you've:
                        <ul className="ml-4 mt-1 list-disc">
                          <li>Created OAuth 2.0 credentials (Web application type)</li>
                          <li>Added the redirect URI above to "Authorized redirect URIs"</li>
                          <li>Enabled the necessary API (Google Ads API for Google Ads)</li>
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="clientId">Client ID *</Label>
                  <Input
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="Enter client ID from the platform"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    placeholder="Enter client secret (optional for some platforms)"
                  />
                </div>

                <div>
                  <Label htmlFor="redirectUri">Custom Redirect URI (optional)</Label>
                  <Input
                    id="redirectUri"
                    value={formData.redirectUri}
                    onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                    placeholder={`Default: ${getRedirectUri()}`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to use the default redirect URI
                  </p>
                </div>

                <div>
                  <Label htmlFor="scopes">Scopes (optional)</Label>
                  <Input
                    id="scopes"
                    value={formData.scopes}
                    onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
                    placeholder={
                      selectedPlatform === 'googleAds'
                        ? "Default: https://www.googleapis.com/auth/adwords"
                        : "e.g., email, profile, ads_read (comma-separated)"
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPlatform === 'googleAds'
                      ? "Leave empty to use the default Google Ads API scope"
                      : "OAuth scopes to request, separated by commas"}
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedPlatform}>
                {editingApp ? 'Update' : 'Create'} OAuth App
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}