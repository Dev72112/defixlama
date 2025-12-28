import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  type UpdateLogInput,
  type TokenListingInput,
} from '@/hooks/useAdminData';
import type { Database } from '@/integrations/supabase/types';

type FeedbackStatus = Database['public']['Enums']['feedback_status'];
type FeedbackType = Database['public']['Enums']['feedback_type'];

const categoryOptions = ['feature', 'bugfix', 'improvement', 'security', 'performance', 'general'];

const chainOptions = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'solana', 'base', 'other'];

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

        <Tabs defaultValue="update-logs" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="update-logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Update Logs
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="tokens" className="gap-2">
              <Coins className="h-4 w-4" />
              Token Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="update-logs">
            <UpdateLogsTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenListingsTab />
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
                  <Badge variant="outline" className="capitalize">{listing.chain}</Badge>
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
                <SelectItem key={chain} value={chain} className="capitalize">{chain}</SelectItem>
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
