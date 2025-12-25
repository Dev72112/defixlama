import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Rocket, 
  Bug, 
  Lightbulb, 
  ListPlus, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Wrench,
  Ban,
  Copy,
  Send
} from 'lucide-react';
import { useUpdateLogs, useFeedback, useSubmitFeedback, FeedbackType, FeedbackStatus } from '@/hooks/useBuilderLogs';
import { format } from 'date-fns';

const categoryIcons: Record<string, React.ReactNode> = {
  launch: <Rocket className="h-4 w-4" />,
  feature: <Lightbulb className="h-4 w-4" />,
  integration: <ListPlus className="h-4 w-4" />,
  i18n: <Clock className="h-4 w-4" />,
  bugfix: <Bug className="h-4 w-4" />,
  general: <Clock className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  launch: 'bg-green-500/20 text-green-400 border-green-500/30',
  feature: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  integration: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  i18n: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bugfix: 'bg-red-500/20 text-red-400 border-red-500/30',
  general: 'bg-muted text-muted-foreground border-border',
};

const feedbackTypeIcons: Record<FeedbackType, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  error: <AlertTriangle className="h-4 w-4" />,
  feature_request: <Lightbulb className="h-4 w-4" />,
  listing: <ListPlus className="h-4 w-4" />,
  other: <Clock className="h-4 w-4" />,
};

const feedbackTypeColors: Record<FeedbackType, string> = {
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  feature_request: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  listing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other: 'bg-muted text-muted-foreground border-border',
};

const statusIcons: Record<FeedbackStatus, React.ReactNode> = {
  pending: <Timer className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  denied: <XCircle className="h-4 w-4" />,
  in_progress: <Wrench className="h-4 w-4" />,
  fixed: <CheckCircle2 className="h-4 w-4" />,
  wont_fix: <Ban className="h-4 w-4" />,
  duplicate: <Copy className="h-4 w-4" />,
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

export default function BuilderLogs() {
  const { t } = useTranslation();
  const { data: updateLogs, isLoading: logsLoading } = useUpdateLogs();
  const { data: feedback, isLoading: feedbackLoading } = useFeedback();
  const submitFeedback = useSubmitFeedback();
  
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug' as FeedbackType,
    title: '',
    description: '',
    contact_email: '',
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) return;
    
    submitFeedback.mutate({
      type: feedbackForm.type,
      title: feedbackForm.title.trim(),
      description: feedbackForm.description.trim(),
      contact_email: feedbackForm.contact_email.trim() || undefined,
    }, {
      onSuccess: () => {
        setFeedbackForm({ type: 'bug', title: '', description: '', contact_email: '' });
      }
    });
  };

  const filteredFeedback = feedback?.filter(f => 
    statusFilter === 'all' || f.status === statusFilter
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('builderLogs.title', 'Builder Logs')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('builderLogs.description', 'Track platform updates and submit feedback')}
          </p>
        </div>

        <Tabs defaultValue="updates" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="updates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('builderLogs.tabs.updates', 'Update Logs')}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('builderLogs.tabs.feedback', 'Community Feedback')}
            </TabsTrigger>
            <TabsTrigger value="submit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('builderLogs.tabs.submit', 'Submit Feedback')}
            </TabsTrigger>
          </TabsList>

          {/* Update Logs Tab */}
          <TabsContent value="updates" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('builderLogs.updateHistory', 'Update History')}
                </CardTitle>
                <CardDescription>
                  {t('builderLogs.updateHistoryDesc', 'All platform updates are automatically tracked here')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="space-y-6">
                      {updateLogs?.map((log, index) => (
                        <div key={log.id} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            log.is_major ? 'bg-primary border-primary' : 'bg-card border-border'
                          }`}>
                            {log.is_major && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                          </div>
                          
                          <Card className={`bg-card/50 border-border ${log.is_major ? 'ring-1 ring-primary/30' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold">{log.title}</h3>
                                    {log.version && (
                                      <Badge variant="outline" className="text-xs">
                                        v{log.version}
                                      </Badge>
                                    )}
                                    {log.is_major && (
                                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                        {t('builderLogs.majorUpdate', 'Major Update')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{log.description}</p>
                                  <div className="flex items-center gap-3">
                                    <Badge 
                                      variant="outline" 
                                      className={`${categoryColors[log.category] || categoryColors.general} text-xs flex items-center gap-1`}
                                    >
                                      {categoryIcons[log.category] || categoryIcons.general}
                                      {log.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      {t('builderLogs.communityFeedback', 'Community Feedback')}
                    </CardTitle>
                    <CardDescription>
                      {t('builderLogs.communityFeedbackDesc', 'Bug reports, feature requests, and more from the community')}
                    </CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-background border-border">
                      <SelectValue placeholder={t('builderLogs.filterStatus', 'Filter by status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('builderLogs.allStatuses', 'All Statuses')}</SelectItem>
                      <SelectItem value="pending">{t('builderLogs.status.pending', 'Pending')}</SelectItem>
                      <SelectItem value="approved">{t('builderLogs.status.approved', 'Approved')}</SelectItem>
                      <SelectItem value="denied">{t('builderLogs.status.denied', 'Denied')}</SelectItem>
                      <SelectItem value="in_progress">{t('builderLogs.status.inProgress', 'In Progress')}</SelectItem>
                      <SelectItem value="fixed">{t('builderLogs.status.fixed', 'Fixed')}</SelectItem>
                      <SelectItem value="wont_fix">{t('builderLogs.status.wontFix', "Won't Fix")}</SelectItem>
                      <SelectItem value="duplicate">{t('builderLogs.status.duplicate', 'Duplicate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredFeedback?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('builderLogs.noFeedback', 'No feedback yet. Be the first to submit!')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFeedback?.map((item) => (
                      <Card key={item.id} className="bg-card/50 border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{item.title}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={`${feedbackTypeColors[item.type]} text-xs flex items-center gap-1`}
                                >
                                  {feedbackTypeIcons[item.type]}
                                  {item.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`${statusColors[item.status]} text-xs flex items-center gap-1`}
                                >
                                  {statusIcons[item.status]}
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Feedback Tab */}
          <TabsContent value="submit" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {t('builderLogs.submitFeedback', 'Submit Feedback')}
                </CardTitle>
                <CardDescription>
                  {t('builderLogs.submitFeedbackDesc', 'Report bugs, request features, or suggest improvements')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('builderLogs.form.type', 'Type')}</label>
                      <Select 
                        value={feedbackForm.type} 
                        onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, type: value as FeedbackType }))}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">
                            <div className="flex items-center gap-2">
                              <Bug className="h-4 w-4" />
                              {t('builderLogs.type.bug', 'Bug Report')}
                            </div>
                          </SelectItem>
                          <SelectItem value="error">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              {t('builderLogs.type.error', 'Error Report')}
                            </div>
                          </SelectItem>
                          <SelectItem value="feature_request">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              {t('builderLogs.type.featureRequest', 'Feature Request')}
                            </div>
                          </SelectItem>
                          <SelectItem value="listing">
                            <div className="flex items-center gap-2">
                              <ListPlus className="h-4 w-4" />
                              {t('builderLogs.type.listing', 'Listing Request')}
                            </div>
                          </SelectItem>
                          <SelectItem value="other">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {t('builderLogs.type.other', 'Other')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('builderLogs.form.email', 'Contact Email (Optional)')}</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={feedbackForm.contact_email}
                        onChange={(e) => setFeedbackForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('builderLogs.form.title', 'Title')}</label>
                    <Input
                      placeholder={t('builderLogs.form.titlePlaceholder', 'Brief summary of your feedback')}
                      value={feedbackForm.title}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-background border-border"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('builderLogs.form.description', 'Description')}</label>
                    <Textarea
                      placeholder={t('builderLogs.form.descriptionPlaceholder', 'Provide details about the bug, feature, or request...')}
                      value={feedbackForm.description}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-background border-border min-h-32"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitFeedback.isPending || !feedbackForm.title.trim() || !feedbackForm.description.trim()}
                  >
                    {submitFeedback.isPending ? (
                      t('builderLogs.form.submitting', 'Submitting...')
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('builderLogs.form.submit', 'Submit Feedback')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
