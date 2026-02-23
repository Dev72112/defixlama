import { useState } from 'react';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Eye, EyeOff, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface APIDocsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function APIDocsPanel({ isOpen = true, onClose }: APIDocsProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/protocols',
      description: 'List all protocols with risk metrics',
      example: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.defixlama.com/api/v1/protocols?chain=xlayer',
    },
    {
      method: 'GET',
      path: '/api/v1/risk/:protocol_slug',
      description: 'Get detailed risk metrics for a protocol',
      example: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.defixlama.com/api/v1/risk/aave',
    },
    {
      method: 'GET',
      path: '/api/v1/predictions/:protocol_slug',
      description: 'Get TVL and APY predictions',
      example: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.defixlama.com/api/v1/predictions/curve',
    },
    {
      method: 'GET',
      path: '/api/v1/governance',
      description: 'List governance events across protocols',
      example: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.defixlama.com/api/v1/governance?limit=50',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-10 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Documentation
          </h2>
          {onClose && <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>}
        </div>

        <div className="p-6 space-y-6">
          {/* Authentication */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Authentication</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Include your API key in the Authorization header:
            </p>
            <div className="bg-muted p-3 rounded-md border border-border">
              <code className="text-xs font-mono text-muted-foreground">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>

          {/* Rate Limiting */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Rate Limiting</h3>
            <p className="text-sm text-muted-foreground">
              Pro tier: 10,000 requests/day
            </p>
          </div>

          {/* Endpoints */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Endpoints</h3>
            <div className="space-y-3">
              {endpoints.map((endpoint) => (
                <div key={endpoint.path} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="font-mono text-xs">{endpoint.method}</Badge>
                    <code className="text-sm font-mono text-muted-foreground">{endpoint.path}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  <div className="bg-muted p-3 rounded-md border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        {endpoint.example}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(endpoint.example, endpoint.path)}
                        className="flex-shrink-0"
                      >
                        {copiedEndpoint === endpoint.path ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Format */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Response Format</h3>
            <div className="bg-muted p-4 rounded-md border border-border">
              <code className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
{`{
  "success": true,
  "data": [...],
  "meta": {
    "count": 12,
    "timestamp": "2026-02-22T12:34:56Z"
  }
}`}
              </code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function APIKeyManager() {
  const { keys, newKeyData, isCreating, isDeleting, createKey, updateKey, deleteKey } = useAPIKeys();
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);

  const handleCreateKey = () => {
    if (!keyName.trim()) {
      alert('Please enter a key name');
      return;
    }
    createKey({ name: keyName, quota_daily: 10000 });
    setKeyName('');
  };

  return (
    <div className="space-y-4">
      {/* New Key Modal */}
      {newKeyData && !showNewKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewKey(false)}>
          <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                API Key Created
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy your API key now. You won't be able to see it again.
              </p>
            </div>

            <div className="p-3 bg-muted border border-border rounded-md">
              <code className="text-sm font-mono text-muted-foreground break-all">
                {newKeyData.fullKey}
              </code>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(newKeyData.fullKey);
                  alert('Copied to clipboard!');
                }}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
              <Button onClick={() => setShowNewKey(true)} variant="outline">
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create New Key Form */}
      <Card className="p-4 border-border">
        <h3 className="font-semibold text-foreground mb-3">Create New API Key</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="key-name" className="text-sm font-medium">
              Key Name
            </Label>
            <Input
              id="key-name"
              placeholder="e.g., Production API"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateKey} disabled={isCreating} className="flex-1">
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Key
            </Button>
            <Button onClick={() => setIsDocsOpen(true)} variant="outline">
              <Code className="h-4 w-4 mr-2" />
              API Docs
            </Button>
          </div>
        </div>
      </Card>

      {/* Existing Keys */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Your Keys</h3>
        {keys.length > 0 ? (
          <div className="space-y-2">
            {keys.map((key) => (
              <Card key={key.id} className="p-4 border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{key.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {key.key_prefix}•••••••••••••••••••••••••
                      </code>
                      <Badge variant={key.enabled ? 'default' : 'secondary'}>
                        {key.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Quota: {key.quota_daily.toLocaleString()} requests/day</p>
                      {key.last_used && (
                        <p>Last used: {new Date(key.last_used).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteKey(key.id)}
                    disabled={isDeleting}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <Code className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">No API keys yet</p>
          </Card>
        )}
      </div>

      {/* Documentation Modal */}
      <APIDocsPanel isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
