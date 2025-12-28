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
  Loader2
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
  type UpdateLogInput,
} from '@/hooks/useAdminData';
import type { Database } from '@/integrations/supabase/types';

type FeedbackStatus = Database['public']['Enums']['feedback_status'];
type FeedbackType = Database['public']['Enums']['feedback_type'];

const categoryOptions = ['feature', 'bugfix', 'improvement', 'security', 'performance', 'general'];

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
  const { user, loading: authLoading, isAdmin } = useAuth();

  // Redirect if not admin
  if (authLoading) {
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
          </TabsList>

          <TabsContent value="update-logs">
            <UpdateLogsTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
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
