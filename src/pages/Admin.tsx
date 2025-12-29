import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import { 
  Shield, 
  FileText, 
  MessageSquare, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  X,
  Sparkles,
  Bug,
  Lightbulb,
  ListPlus,
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Coins,
  Star,
  Globe,
  Link as LinkIcon,
  Settings,
  BarChart3,
  Users,
  DatabaseIcon,
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Copy,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import {
  useAdminUpdateLogs,
  useCreateUpdateLog,
  useUpdateUpdateLog,
  useDeleteUpdateLog,
  useAdminFeedback,
  useUpdateFeedback,
  useDeleteFeedback,
  useAdminTokenListings,
  useCreateTokenListing,
  useUpdateTokenListing,
  useDeleteTokenListing,
  useSiteSettings,
  useUpdateSiteSetting,
  type UpdateLogInput,
  type TokenListingInput,
  type GeneralSettings,
  type FeatureSettings,
} from '@/hooks/useAdminData';
import type { Database } from '@/integrations/supabase/types';

type FeedbackStatus = Database['public']['Enums']['feedback_status'];
type FeedbackType = Database['public']['Enums']['feedback_type'];

const categoryOptions = ['feature', 'bugfix', 'improvement', 'security', 'performance', 'general'];

const chainOptions = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { value: 'bsc', label: 'BNB Chain', icon: '🔶' },
  { value: 'polygon', label: 'Polygon', icon: '🟣' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔵' },
  { value: 'optimism', label: 'Optimism', icon: '🔴' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
  { value: 'fantom', label: 'Fantom', icon: '👻' },
  { value: 'solana', label: 'Solana', icon: '◎' },
  { value: 'base', label: 'Base', icon: '🔵' },
  { value: 'xlayer', label: 'X Layer', icon: '✖️' },
  { value: 'zksync', label: 'zkSync Era', icon: '⚡' },
  { value: 'linea', label: 'Linea', icon: '🌀' },
  { value: 'scroll', label: 'Scroll', icon: '📜' },
  { value: 'mantle', label: 'Mantle', icon: '🏔️' },
  { value: 'manta', label: 'Manta Pacific', icon: '🦈' },
  { value: 'blast', label: 'Blast', icon: '💥' },
  { value: 'mode', label: 'Mode', icon: '🟢' },
  { value: 'sei', label: 'Sei', icon: '🌊' },
  { value: 'sui', label: 'Sui', icon: '💧' },
  { value: 'aptos', label: 'Aptos', icon: '🅰️' },
  { value: 'ton', label: 'TON', icon: '💎' },
  { value: 'tron', label: 'TRON', icon: '🔷' },
  { value: 'near', label: 'NEAR', icon: '🌐' },
  { value: 'cosmos', label: 'Cosmos', icon: '⚛️' },
  { value: 'other', label: 'Other', icon: '🔗' },
];

const feedbackTypeIcons: Record<FeedbackType, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  feature_request: <Lightbulb className="h-4 w-4" />,
  listing: <ListPlus className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const statusOptions: FeedbackStatus[] = [
  'pending', 'approved', 'denied', 'in_progress', 'fixed', 'wont_fix', 'duplicate'
];

const statusIcons: Record<FeedbackStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  denied: <XCircle className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4" />,
  fixed: <CheckCircle className="h-4 w-4" />,
  wont_fix: <XCircle className="h-4 w-4" />,
  duplicate: <AlertCircle className="h-4 w-4" />,
};

const statusColors: Record<FeedbackStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  denied: 'bg-red-500/20 text-red-400 border-red-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fixed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  wont_fix: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  duplicate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export default function Admin() {
  const { t } = useTranslation();
  const { user, loading: authLoading, isAdmin, adminLoading } = useAuth();

  // Redirect if not admin - wait for both auth and admin check
  if (authLoading || adminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage platform content and feedback</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tokens" className="gap-2">
              <Coins className="h-4 w-4" />
              Token Listings
            </TabsTrigger>
            <TabsTrigger value="update-logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Update Logs
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Site Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenListingsTab />
          </TabsContent>

          <TabsContent value="update-logs">
            <UpdateLogsTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function UpdateLogsTab() {
  const { data: logs, isLoading } = useAdminUpdateLogs();
  const createMutation = useCreateUpdateLog();
  const updateMutation = useUpdateUpdateLog();
  const deleteMutation = useDeleteUpdateLog();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateLogInput>({
    title: '',
    description: '',
    category: 'general',
    version: null,
    is_major: false,
  });

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'general', version: null, is_major: false });
    setEditingId(null);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync(form);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateMutation.mutateAsync({ id: editingId, ...form });
    resetForm();
  };

  const startEdit = (log: any) => {
    setForm({
      title: log.title,
      description: log.description,
      category: log.category,
      version: log.version,
      is_major: log.is_major || false,
    });
    setEditingId(log.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Update Logs</CardTitle>
          <CardDescription>Manage platform update announcements</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Update
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Update Log</DialogTitle>
              <DialogDescription>Add a new platform update announcement</DialogDescription>
            </DialogHeader>
            <UpdateLogForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Major</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                {editingId === log.id ? (
                  <>
                    <TableCell colSpan={4}>
                      <div className="space-y-2">
                        <Input
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="Title"
                        />
                        <Textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={form.version || ''}
                            onChange={(e) => setForm({ ...form, version: e.target.value || null })}
                            placeholder="Version"
                            className="w-24"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={form.is_major}
                              onCheckedChange={(v) => setForm({ ...form, is_major: v })}
                            />
                            <Label>Major</Label>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(log.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={resetForm}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium max-w-xs truncate">{log.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{log.category}</Badge>
                    </TableCell>
                    <TableCell>{log.version || '-'}</TableCell>
                    <TableCell>
                      {log.is_major ? <Sparkles className="h-4 w-4 text-yellow-500" /> : '-'}
                    </TableCell>
                    <TableCell>{format(new Date(log.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Update Log</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{log.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(log.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {logs?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No update logs yet. Create your first one!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpdateLogForm({ form, setForm }: { form: UpdateLogInput; setForm: (f: UpdateLogInput) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Update title"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the update..."
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Version (optional)</Label>
          <Input
            value={form.version || ''}
            onChange={(e) => setForm({ ...form, version: e.target.value || null })}
            placeholder="e.g., v1.2.0"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_major}
          onCheckedChange={(v) => setForm({ ...form, is_major: v })}
        />
        <Label>Mark as major update</Label>
      </div>
    </div>
  );
}

function FeedbackTab() {
  const { data: feedback, isLoading } = useAdminFeedback();
  const updateMutation = useUpdateFeedback();
  const deleteMutation = useDeleteFeedback();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Management</CardTitle>
        <CardDescription>Review and respond to user feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback?.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted">
                    {feedbackTypeIcons[item.type]}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                      {item.contact_email && ` • ${item.contact_email}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={item.status}
                    onValueChange={(status: FeedbackStatus) => 
                      updateMutation.mutate({ id: item.id, status })
                    }
                  >
                    <SelectTrigger className={`w-36 ${statusColors[item.status]}`}>
                      <div className="flex items-center gap-2">
                        {statusIcons[item.status]}
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            {statusIcons[status]}
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this feedback. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{item.description}</p>
              
              <div className="pt-2 border-t border-border">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({ id: item.id, admin_notes: editNotes });
                          setEditingId(null);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Save Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Admin Notes:</span>
                      <p className="text-sm">{item.admin_notes || <span className="italic text-muted-foreground">No notes</span>}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditNotes(item.admin_notes || '');
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {feedback?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No feedback submitted yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TokenListingsTab() {
  const { data: listings, isLoading } = useAdminTokenListings();
  const createMutation = useCreateTokenListing();
  const updateMutation = useUpdateTokenListing();
  const deleteMutation = useDeleteTokenListing();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TokenListingInput>({
    name: '',
    symbol: '',
    contract_address: null,
    chain: 'ethereum',
    logo_url: null,
    website_url: null,
    twitter_url: null,
    telegram_url: null,
    coingecko_id: null,
    description: null,
    is_active: true,
    is_featured: false,
  });

  const resetForm = () => {
    setForm({
      name: '',
      symbol: '',
      contract_address: null,
      chain: 'ethereum',
      logo_url: null,
      website_url: null,
      twitter_url: null,
      telegram_url: null,
      coingecko_id: null,
      description: null,
      is_active: true,
      is_featured: false,
    });
    setEditingId(null);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync(form);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateMutation.mutateAsync({ id: editingId, ...form });
    resetForm();
  };

  const startEdit = (listing: any) => {
    setForm({
      name: listing.name,
      symbol: listing.symbol,
      contract_address: listing.contract_address,
      chain: listing.chain,
      logo_url: listing.logo_url,
      website_url: listing.website_url,
      twitter_url: listing.twitter_url,
      telegram_url: listing.telegram_url,
      coingecko_id: listing.coingecko_id,
      description: listing.description,
      is_active: listing.is_active,
      is_featured: listing.is_featured,
    });
    setEditingId(listing.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Token Listings</CardTitle>
          <CardDescription>Manage listed tokens on the platform</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Token
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Token Listing</DialogTitle>
              <DialogDescription>Add a new token to the platform</DialogDescription>
            </DialogHeader>
            <TokenListingForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings?.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {listing.logo_url ? (
                      <img src={listing.logo_url} alt={listing.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{listing.name}</p>
                      <p className="text-xs text-muted-foreground">{listing.symbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {chainOptions.find(c => c.value === listing.chain)?.icon} {chainOptions.find(c => c.value === listing.chain)?.label || listing.chain}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={listing.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                    {listing.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {listing.is_featured ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : '-'}
                </TableCell>
                <TableCell>{format(new Date(listing.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(listing)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Token Listing</DialogTitle>
                          <DialogDescription>Update token information</DialogDescription>
                        </DialogHeader>
                        <TokenListingForm form={form} setForm={setForm} />
                        <DialogFooter>
                          <Button variant="outline" onClick={resetForm}>Cancel</Button>
                          <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Token Listing</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{listing.name}" ({listing.symbol}). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(listing.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {listings?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No token listings yet. Add your first one!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TokenListingForm({ form, setForm }: { form: TokenListingInput; setForm: (f: TokenListingInput) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Bitcoin"
          />
        </div>
        <div className="space-y-2">
          <Label>Symbol *</Label>
          <Input
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            placeholder="BTC"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chain *</Label>
          <Select value={form.chain} onValueChange={(v) => setForm({ ...form, chain: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chainOptions.map((chain) => (
                <SelectItem key={chain.value} value={chain.value}>
                  <span className="flex items-center gap-2">
                    <span>{chain.icon}</span>
                    <span>{chain.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contract Address</Label>
          <Input
            value={form.contract_address || ''}
            onChange={(e) => setForm({ ...form, contract_address: e.target.value || null })}
            placeholder="0x..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Logo URL</Label>
          <Input
            value={form.logo_url || ''}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Website URL</Label>
          <Input
            value={form.website_url || ''}
            onChange={(e) => setForm({ ...form, website_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Twitter/X URL</Label>
          <Input
            value={form.twitter_url || ''}
            onChange={(e) => setForm({ ...form, twitter_url: e.target.value || null })}
            placeholder="https://x.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label>Telegram URL</Label>
          <Input
            value={form.telegram_url || ''}
            onChange={(e) => setForm({ ...form, telegram_url: e.target.value || null })}
            placeholder="https://t.me/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>CoinGecko ID</Label>
        <Input
          value={form.coingecko_id || ''}
          onChange={(e) => setForm({ ...form, coingecko_id: e.target.value || null })}
          placeholder="bitcoin"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value || null })}
          placeholder="Brief description of the token..."
          rows={3}
        />
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.is_active ?? true}
            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
          />
          <Label>Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.is_featured ?? false}
            onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
          />
          <Label>Featured</Label>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data: logs } = useAdminUpdateLogs();
  const { data: feedback } = useAdminFeedback();
  const { data: listings } = useAdminTokenListings();

  const stats = [
    {
      title: 'Total Tokens',
      value: listings?.length || 0,
      icon: Coins,
      description: `${listings?.filter(l => l.is_active)?.length || 0} active`,
      color: 'text-blue-400',
    },
    {
      title: 'Featured Tokens',
      value: listings?.filter(l => l.is_featured)?.length || 0,
      icon: Star,
      description: 'Highlighted on platform',
      color: 'text-yellow-400',
    },
    {
      title: 'Update Logs',
      value: logs?.length || 0,
      icon: FileText,
      description: `${logs?.filter(l => l.is_major)?.length || 0} major updates`,
      color: 'text-green-400',
    },
    {
      title: 'Feedback Items',
      value: feedback?.length || 0,
      icon: MessageSquare,
      description: `${feedback?.filter(f => f.status === 'pending')?.length || 0} pending`,
      color: 'text-purple-400',
    },
  ];

  const pendingFeedback = feedback?.filter(f => f.status === 'pending') || [];
  const recentLogs = logs?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Pending Feedback
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingFeedback.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending feedback</p>
            ) : (
              <div className="space-y-3">
                {pendingFeedback.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b border-border pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Recent Updates
            </CardTitle>
            <CardDescription>Latest platform changes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No update logs yet</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between border-b border-border pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{log.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{log.category}</p>
                    </div>
                    {log.is_major && (
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Chain Distribution
          </CardTitle>
          <CardDescription>Token listings by blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {chainOptions.map((chain) => {
              const count = listings?.filter(l => l.chain === chain.value)?.length || 0;
              if (count === 0) return null;
              return (
                <div key={chain.value} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{chain.icon}</span>
                    <span className="text-sm font-medium">{chain.label}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              );
            })}
          </div>
          {listings?.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No tokens listed yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SiteSettingsTab() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const { data: listings } = useAdminTokenListings();
  const { data: feedback } = useAdminFeedback();
  const { data: logs } = useAdminUpdateLogs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [generalForm, setGeneralForm] = useState<GeneralSettings>({
    site_name: 'DeFi Dashboard',
    site_description: 'Your comprehensive DeFi analytics platform',
    default_theme: 'system',
  });

  const [featuresForm, setFeaturesForm] = useState<FeatureSettings>({
    maintenance_mode: false,
    analytics_enabled: true,
    public_registration: true,
  });

  const [hasChanges, setHasChanges] = useState({ general: false, features: false });
  const [initialized, setInitialized] = useState(false);

  // Properly sync form state with loaded settings using useEffect
  useEffect(() => {
    if (settings && !initialized) {
      setGeneralForm({
        site_name: settings.general.site_name || 'DeFi Dashboard',
        site_description: settings.general.site_description || 'Your comprehensive DeFi analytics platform',
        default_theme: settings.general.default_theme || 'system',
      });
      setFeaturesForm({
        maintenance_mode: settings.features.maintenance_mode ?? false,
        analytics_enabled: settings.features.analytics_enabled ?? true,
        public_registration: settings.features.public_registration ?? true,
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSaveGeneral = async () => {
    await updateMutation.mutateAsync({ key: 'general', value: generalForm });
    setHasChanges(prev => ({ ...prev, general: false }));
  };

  const handleSaveFeatures = async () => {
    await updateMutation.mutateAsync({ key: 'features', value: featuresForm });
    setHasChanges(prev => ({ ...prev, features: false }));
  };

  // Data management exports
  const handleExportTokens = () => {
    if (!listings?.length) {
      toast.error('No token listings to export');
      return;
    }
    exportToCSV(
      listings.map(t => ({
        Name: t.name,
        Symbol: t.symbol,
        Chain: t.chain,
        'Contract Address': t.contract_address || '',
        'CoinGecko ID': t.coingecko_id || '',
        'Website': t.website_url || '',
        'Active': t.is_active ? 'Yes' : 'No',
        'Featured': t.is_featured ? 'Yes' : 'No',
        'Created': t.created_at,
      })),
      'token_listings'
    );
    toast.success('Token listings exported');
  };

  const handleExportFeedback = () => {
    if (!feedback?.length) {
      toast.error('No feedback to export');
      return;
    }
    exportToCSV(
      feedback.map(f => ({
        Title: f.title,
        Type: f.type,
        Description: f.description,
        Status: f.status,
        'Contact Email': f.contact_email || '',
        'Admin Notes': f.admin_notes || '',
        'Created': f.created_at,
      })),
      'feedback'
    );
    toast.success('Feedback exported');
  };

  const handleExportLogs = () => {
    if (!logs?.length) {
      toast.error('No update logs to export');
      return;
    }
    exportToCSV(
      logs.map(l => ({
        Title: l.title,
        Description: l.description,
        Category: l.category,
        Version: l.version || '',
        'Is Major': l.is_major ? 'Yes' : 'No',
        'Created': l.created_at,
      })),
      'update_logs'
    );
    toast.success('Update logs exported');
  };

  // Quick actions
  const handleRefreshPrices = () => {
    queryClient.invalidateQueries({ queryKey: ['token-prices'] });
    toast.success('Price data refresh triggered');
  };

  const handlePreviewAsUser = () => {
    window.open('/', '_blank');
  };

  const handleClearCache = () => {
    queryClient.clear();
    toast.success('Application cache cleared');
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site Name</Label>
            <Input
              value={generalForm.site_name}
              onChange={(e) => {
                setGeneralForm({ ...generalForm, site_name: e.target.value });
                setHasChanges(prev => ({ ...prev, general: true }));
              }}
              placeholder="Your platform name"
            />
          </div>
          <div className="space-y-2">
            <Label>Site Description</Label>
            <Textarea
              value={generalForm.site_description}
              onChange={(e) => {
                setGeneralForm({ ...generalForm, site_description: e.target.value });
                setHasChanges(prev => ({ ...prev, general: true }));
              }}
              placeholder="Brief description of your platform"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Default Theme</Label>
            <Select 
              value={generalForm.default_theme} 
              onValueChange={(v: 'system' | 'light' | 'dark') => {
                setGeneralForm({ ...generalForm, default_theme: v });
                setHasChanges(prev => ({ ...prev, general: true }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Default</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSaveGeneral} 
            disabled={!hasChanges.general || updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Feature Toggles
          </CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable site access for non-admins
              </p>
            </div>
            <Switch
              checked={featuresForm.maintenance_mode}
              onCheckedChange={(v) => {
                setFeaturesForm({ ...featuresForm, maintenance_mode: v });
                setHasChanges(prev => ({ ...prev, features: true }));
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Analytics Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable usage analytics
              </p>
            </div>
            <Switch
              checked={featuresForm.analytics_enabled}
              onCheckedChange={(v) => {
                setFeaturesForm({ ...featuresForm, analytics_enabled: v });
                setHasChanges(prev => ({ ...prev, features: true }));
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new user signups
              </p>
            </div>
            <Switch
              checked={featuresForm.public_registration}
              onCheckedChange={(v) => {
                setFeaturesForm({ ...featuresForm, public_registration: v });
                setHasChanges(prev => ({ ...prev, features: true }));
              }}
            />
          </div>
          <Button 
            onClick={handleSaveFeatures} 
            disabled={!hasChanges.features || updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Feature Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
            Data Management
          </CardTitle>
          <CardDescription>Export and manage platform data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleExportTokens}
          >
            <Download className="h-4 w-4" />
            Export Token Listings ({listings?.length || 0} tokens)
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleExportFeedback}
          >
            <Download className="h-4 w-4" />
            Export Feedback ({feedback?.length || 0} items)
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleExportLogs}
          >
            <Download className="h-4 w-4" />
            Export Update Logs ({logs?.length || 0} logs)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleRefreshPrices}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Price Data
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handlePreviewAsUser}
          >
            <Eye className="h-4 w-4" />
            Preview Site as User
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleClearCache}
          >
            <Trash2 className="h-4 w-4" />
            Clear Cache
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
