import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks/usePortfolio';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { canAccessFeature } from '@/lib/subscriptionHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, Plus, Edit2, Trash2, DollarSign, PieChart as PieChartIcon, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(280, 80%, 60%)', 'hsl(200, 80%, 50%)', 'hsl(142, 76%, 46%)', 'hsl(45, 100%, 50%)', 'hsl(348, 83%, 47%)'];

export default function PortfolioDashboard() {
  const { subscription_tier } = useAuth();
  const { positions, stats, isLoading, error } = usePortfolio();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Check if user can access portfolio dashboard
  if (!canAccessFeature(subscription_tier, 'portfolio_dashboard')) {
    return (
      <Layout>
        <UpgradePrompt
          feature="Portfolio Dashboard"
          currentTier={subscription_tier}
          requiredTier="pro"
          description="Track your DeFi positions, monitor P&L, and optimize your portfolio allocation. Available in Pro and Enterprise plans."
        />
      </Layout>
    );
  }

  const portfolioValue = stats?.totalValue || 0;
  const todayChange = stats?.dayChangePercent || 0;
  const unrealizedGains = stats?.unrealizedGains || 0;
  const realizedGains = stats?.realizedGains || 0;

  // Prepare chart data
  const allocationData = positions?.map((p) => ({
    name: p.protocol_name || p.protocol_slug,
    value: p.currentValue || 0,
    label: p.protocol_slug,
  })) || [];

  const performanceData = positions?.map((p) => ({
    protocol: p.protocol_name?.substring(0, 8) || p.protocol_slug,
    gain: ((p.currentValue || 0) - (p.costBasis || 0)) / (p.costBasis || 1) * 100,
    value: p.currentValue || 0,
  })) || [];

  const changeColor = todayChange >= 0 ? 'text-green-500' : 'text-red-500';
  const gainsColor = unrealizedGains >= 0 ? 'text-green-500' : 'text-red-500';

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Portfolio Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Track your DeFi positions and performance</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Portfolio Value</p>
            <p className="text-3xl font-bold text-foreground">${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className={cn('text-sm mt-2', changeColor)}>
              {todayChange >= 0 ? '+' : ''}{todayChange.toFixed(2)}% today
            </p>
          </Card>

          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Unrealized P&L</p>
            <p className={cn('text-3xl font-bold', gainsColor)}>${unrealizedGains.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-2">Gains/Losses</p>
          </Card>

          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Realized P&L</p>
            <p className={cn('text-3xl font-bold', realizedGains >= 0 ? 'text-green-500' : 'text-red-500')}>
              ${realizedGains.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Closed positions</p>
          </Card>

          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Positions</p>
            <p className="text-3xl font-bold text-foreground">{positions?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Active protocols</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Allocation */}
          <Card className="p-4 border-border">
            <p className="text-sm font-semibold text-foreground mb-4">Portfolio Allocation</p>
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${(value as number).toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No positions yet. Add one to get started!</p>
              </div>
            )}
          </Card>

          {/* Performance */}
          <Card className="p-4 border-border">
            <p className="text-sm font-semibold text-foreground mb-4">Position Performance</p>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <XAxis dataKey="protocol" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `${(value as number).toFixed(2)}%`}
                  />
                  <Bar dataKey="gain" fill="hsl(280, 80%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No performance data yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Positions List */}
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Your Positions</p>
            <Badge variant="secondary">{positions?.length || 0} total</Badge>
          </div>

          {positions && positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((position) => {
                const gain = ((position.currentValue || 0) - (position.costBasis || 0)) / (position.costBasis || 1) * 100;
                const gainColor = gain >= 0 ? 'text-green-500' : 'text-red-500';

                return (
                  <div key={position.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{position.protocol_name || position.protocol_slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {position.quantity} @ ${(position.entryPrice || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right mr-4">
                      <p className="font-semibold text-foreground">${(position.currentValue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                      <p className={cn('text-xs font-medium', gainColor)}>
                        {gain >= 0 ? '+' : ''}{gain.toFixed(2)}%
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPosition(position.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No positions yet</p>
                <Button onClick={() => setShowAddModal(true)}>Add Your First Position</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add Position Modal - Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Add Position</h2>
              <p className="text-sm text-muted-foreground">Coming soon - Full position editor will be available shortly</p>
              <Button onClick={() => setShowAddModal(false)} variant="outline" className="w-full">
                Close
              </Button>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
