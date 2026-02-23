import { useQuery } from '@tanstack/react-query';

export interface GovernanceProposal {
  id: string;
  protocol_slug: string;
  protocol_name: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'canceled';
  created_at: string;
  end_date: string;
  vote_break: {
    for: number;
    against: number;
    abstain: number;
  };
  voting_power_needed: number;
}

export interface GovernanceEvent {
  id: string;
  protocol_slug: string;
  protocol_name: string;
  event_type: 'proposal_created' | 'vote_cast' | 'delegation_changed' | 'proposal_passed';
  description: string;
  timestamp: string;
  impact: number; // 1-10 importance scale
}

export interface UserVotingPower {
  protocol_slug: string;
  protocol_name: string;
  tokens_held: number;
  voting_power: number;
  delegation_active: boolean;
  votes_cast: number;
  proposals_participated: number;
  influence_score: number; // 0-100
}

const SAMPLE_PROPOSALS: GovernanceProposal[] = [
  {
    id: 'aave-prop-123',
    protocol_slug: 'aave',
    protocol_name: 'Aave',
    title: 'Enable ETH-BTC Farm on Polygon',
    description: 'Proposal to enable ETH and BTC farming on Polygon network with 5% interest rate',
    status: 'active',
    created_at: '2025-01-15T00:00:00Z',
    end_date: '2025-01-22T00:00:00Z',
    vote_break: {
      for: 85,
      against: 12,
      abstain: 3,
    },
    voting_power_needed: 80000,
  },
  {
    id: 'curve-prop-456',
    protocol_slug: 'curve',
    protocol_name: 'Curve',
    title: 'Increase Gauge Weight for USDC/DAI Pair',
    description: 'Redirect emission rewards to higher liquidity providers',
    status: 'active',
    created_at: '2025-01-18T00:00:00Z',
    end_date: '2025-01-25T00:00:00Z',
    vote_break: {
      for: 72,
      against: 22,
      abstain: 6,
    },
    voting_power_needed: 50000,
  },
  {
    id: 'lido-prop-789',
    protocol_slug: 'lido',
    protocol_name: 'Lido',
    title: 'Consensus Layer Rewards Distribution Update',
    description: 'Modify how consensus layer rewards are distributed among stakers',
    status: 'passed',
    created_at: '2025-01-10T00:00:00Z',
    end_date: '2025-01-17T00:00:00Z',
    vote_break: {
      for: 91,
      against: 7,
      abstain: 2,
    },
    voting_power_needed: 120000,
  },
  {
    id: 'yearn-prop-321',
    protocol_slug: 'yearn',
    protocol_name: 'Yearn',
    title: 'New ETH Vault Strategy',
    description: 'Approve new yield farming strategy for ETH vaults',
    status: 'failed',
    created_at: '2025-01-09T00:00:00Z',
    end_date: '2025-01-16T00:00:00Z',
    vote_break: {
      for: 45,
      against: 48,
      abstain: 7,
    },
    voting_power_needed: 100000,
  },
  {
    id: 'balancer-prop-654',
    protocol_slug: 'balancer',
    protocol_name: 'Balancer',
    title: 'Fee Switch Activation',
    description: 'Enable protocol fee switch to start protocol revenue generation',
    status: 'active',
    created_at: '2025-01-20T00:00:00Z',
    end_date: '2025-01-27T00:00:00Z',
    vote_break: {
      for: 68,
      against: 25,
      abstain: 7,
    },
    voting_power_needed: 30000,
  },
];

const SAMPLE_EVENTS: GovernanceEvent[] = [
  {
    id: 'evt-1',
    protocol_slug: 'aave',
    protocol_name: 'Aave',
    event_type: 'proposal_created',
    description: 'New proposal created: Enable ETH-BTC Farm on Polygon',
    timestamp: '2025-01-15T10:30:00Z',
    impact: 8,
  },
  {
    id: 'evt-2',
    protocol_slug: 'curve',
    protocol_name: 'Curve',
    event_type: 'vote_cast',
    description: 'Major holder cast 500k CRV vote on gauge proposal',
    timestamp: '2025-01-18T14:20:00Z',
    impact: 7,
  },
  {
    id: 'evt-3',
    protocol_slug: 'lido',
    protocol_name: 'Lido',
    event_type: 'proposal_passed',
    description: 'Consensus Layer Rewards Update proposal passed with 91% support',
    timestamp: '2025-01-17T22:45:00Z',
    impact: 10,
  },
  {
    id: 'evt-4',
    protocol_slug: 'yearn',
    protocol_name: 'Yearn',
    event_type: 'delegation_changed',
    description: 'Governance delegation redirect from core team to community multisig',
    timestamp: '2025-01-16T09:15:00Z',
    impact: 6,
  },
];

const SAMPLE_VOTING_POWER: UserVotingPower[] = [
  {
    protocol_slug: 'aave',
    protocol_name: 'Aave',
    tokens_held: 250,
    voting_power: 250000,
    delegation_active: true,
    votes_cast: 12,
    proposals_participated: 8,
    influence_score: 45,
  },
  {
    protocol_slug: 'curve',
    protocol_name: 'Curve',
    tokens_held: 5000,
    voting_power: 500000,
    delegation_active: true,
    votes_cast: 24,
    proposals_participated: 15,
    influence_score: 72,
  },
  {
    protocol_slug: 'lido',
    protocol_name: 'Lido',
    tokens_held: 100,
    voting_power: 100000,
    delegation_active: false,
    votes_cast: 5,
    proposals_participated: 3,
    influence_score: 28,
  },
];

export function useGovernanceProposals(protocolSlug?: string) {
  return useQuery({
    queryKey: ['governance-proposals', protocolSlug],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return protocolSlug
        ? SAMPLE_PROPOSALS.filter((p) => p.protocol_slug === protocolSlug)
        : SAMPLE_PROPOSALS;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGovernanceEvents(limit?: number) {
  return useQuery({
    queryKey: ['governance-events', limit],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const events = SAMPLE_EVENTS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit ? events.slice(0, limit) : events;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useUserVotingPower() {
  return useQuery({
    queryKey: ['user-voting-power'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return SAMPLE_VOTING_POWER;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function calculateVotingPowerPercentage(userVotes: number, totalVotingPower: number): number {
  return totalVotingPower === 0 ? 0 : (userVotes / totalVotingPower) * 100;
}

export function getProposalStatus(proposal: GovernanceProposal): string {
  const endDate = new Date(proposal.end_date);
  const now = new Date();

  if (proposal.status === 'passed' || proposal.status === 'failed' || proposal.status === 'canceled') {
    return proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1);
  }

  if (endDate < now) {
    const total = proposal.vote_break.for + proposal.vote_break.against;
    const forPercentage = total === 0 ? 0 : (proposal.vote_break.for / total) * 100;
    return forPercentage > 50 ? 'Passed' : 'Failed';
  }

  return 'Active';
}
