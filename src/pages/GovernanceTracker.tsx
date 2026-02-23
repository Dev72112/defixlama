import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useGovernanceProposals, useGovernanceEvents, useUserVotingPower, getProposalStatus } from '@/hooks/useGovernance';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  aave: 'hsl(142, 76%, 46%)',
  curve: 'hsl(45, 100%, 50%)',
  lido: 'hsl(280, 80%, 60%)',
  yearn: 'hsl(180, 80%, 45%)',
  balancer: 'hsl(30, 90%, 55%)',
};

export default function GovernanceTracker() {
  const { data: proposals, isLoading: proposalsLoading } = useGovernanceProposals();
  const { data: events, isLoading: eventsLoading } = useGovernanceEvents();
  const { data: votingPower, isLoading: votingPowerLoading } = useUserVotingPower();
  const [filteredStatus, setFilteredStatus] = useState<'all' | 'active' | 'passed' | 'failed'>('all');

  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    if (filteredStatus === 'all') return proposals;
    return proposals.filter((p) => {
      const status = getProposalStatus(p).toLowerCase();
      return status === filteredStatus;
    });
  }, [proposals, filteredStatus]);

  const totalVotingPower = useMemo(() => {
    if (!votingPower) return 0;
    return votingPower.reduce((sum, vp) => sum + vp.voting_power, 0);
  }, [votingPower]);

  const avgInfluenceScore = useMemo(() => {
    if (!votingPower || votingPower.length === 0) return 0;
    return Math.round(votingPower.reduce((sum, vp) => sum + vp.influence_score, 0) / votingPower.length);
  }, [votingPower]);

  if (proposalsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading governance data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Vote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Governance Tracker</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor active proposals, voting power, and governance events
            </p>
          </div>
        </div>

        {/* Your Voting Power Summary */}
        {votingPower && !votingPowerLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Voting Power */}
            <Card className="p-4 border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Total Voting Power</p>
                  <p className="text-2xl font-bold text-primary mt-2 font-mono">
                    {(totalVotingPower / 1000000).toFixed(1)}M
                  </p>
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </Card>

            {/* Influence Score */}
            <Card className="p-4 border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Influence Score</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{avgInfluenceScore}</p>
                  <p className="text-xs text-muted-foreground mt-1">Average across pools</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </Card>

            {/* Total Proposals Participated */}
            <Card className="p-4 border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Participated</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {votingPower.reduce((sum, vp) => sum + vp.proposals_participated, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Governance decisions</p>
                </div>
                <Vote className="h-5 w-5 text-blue-600" />
              </div>
            </Card>

            {/* Votes Cast */}
            <Card className="p-4 border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Votes Cast</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    {votingPower.reduce((sum, vp) => sum + vp.votes_cast, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total across protocols</p>
                </div>
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Your Voting Power by Protocol */}
        {votingPower && !votingPowerLoading && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Your Voting Power</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {votingPower.map((vp) => (
                <Card key={vp.protocol_slug} className="p-4 border-border">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">{vp.protocol_name}</h3>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-muted-foreground">Tokens Held</p>
                        <p className="text-sm font-mono font-semibold">{vp.tokens_held.toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">= {vp.voting_power.toLocaleString()} voting power</p>
                    </div>

                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Delegation</p>
                        <Badge variant="outline" className={vp.delegation_active ? 'bg-green-500/10' : 'bg-gray-500/10'}>
                          {vp.delegation_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Influence: <span className="font-semibold text-foreground">{vp.influence_score}/100</span>
                      </p>
                    </div>

                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {vp.votes_cast} votes • {vp.proposals_participated} proposals
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'active', 'passed', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilteredStatus(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filteredStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Active Proposals */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Governance Proposals</h2>
          <div className="space-y-3">
            {filteredProposals && filteredProposals.length > 0 ? (
              filteredProposals.map((proposal) => {
                const status = getProposalStatus(proposal).toLowerCase();
                const statusColor =
                  status === 'active'
                    ? 'bg-blue-500/10 text-blue-600'
                    : status === 'passed'
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-red-500/10 text-red-600';

                const total = proposal.vote_break.for + proposal.vote_break.against;
                const forPercent = total === 0 ? 0 : (proposal.vote_break.for / total) * 100;
                const againstPercent = total === 0 ? 0 : (proposal.vote_break.against / total) * 100;

                return (
                  <Card key={proposal.id} className="p-4 border-border hover:ring-1 hover:ring-primary/50 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <div
                              className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                              style={{ backgroundColor: COLORS[proposal.protocol_slug as keyof typeof COLORS] }}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium">{proposal.protocol_name}</p>
                              <h3 className="font-semibold text-foreground text-sm mt-0.5">{proposal.title}</h3>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{proposal.description}</p>
                        </div>

                        <div className="flex-shrink-0">
                          <Badge className={cn('px-2 py-1 text-[11px]', statusColor)}>
                            {status === 'active' ? (
                              <Clock className="h-3 w-3 mr-1" />
                            ) : status === 'passed' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Vote Breakdown */}
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-2">Vote Breakdown</p>
                        <div className="space-y-1">
                          {/* For Votes */}
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${forPercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-mono font-semibold whitespace-nowrap">
                              {forPercent.toFixed(1)}%
                            </span>
                          </div>

                          {/* Against Votes */}
                          <div className="flex items-center gap-2">
                            <ThumbsDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500 rounded-full"
                                  style={{ width: `${againstPercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-mono font-semibold whitespace-nowrap">
                              {againstPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-t border-border pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Ends: {new Date(proposal.end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{proposal.voting_power_needed.toLocaleString()} VP needed</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 border-border text-center">
                <p className="text-muted-foreground">No proposals found with the selected filter</p>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Events */}
        {events && !eventsLoading && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Governance Events</h2>
            <div className="space-y-2">
              {events.map((event) => (
                <Card key={event.id} className="p-3 border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          backgroundColor: COLORS[event.protocol_slug as keyof typeof COLORS],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{event.protocol_name}</span> •{' '}
                          {new Date(event.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-foreground mt-0.5">{event.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto flex-shrink-0">
                      <span className="text-[10px]">Impact: {event.impact}/10</span>
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <Card className="p-4 border-border bg-card/50">
          <p className="text-xs text-muted-foreground">
            <strong>Governance Intelligence:</strong> Track active proposals, your voting power across protocols, and
            important governance events. Your influence score reflects your voting participation and token holdings.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
