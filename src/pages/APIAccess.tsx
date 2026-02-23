import { Layout } from '@/components/layout/Layout';
import { APIKeyManager } from '@/components/APIKeyManager';
import { Card } from '@/components/ui/card';
import { Code, BookOpen, Zap, Shield, BarChart3 } from 'lucide-react';

export default function APIAccess() {
  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Code className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">API Access</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Programmatic access to DeFi X-ray analytics for your applications
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-border">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Well Documented</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive API docs with examples in curl and common languages
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">High Performance</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sub-100ms response times, intelligently cached data
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Secure</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  API keys hashed, rate-limited, per-user quota management
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Key Manager */}
        <APIKeyManager />

        {/* Use Cases */}
        <Card className="p-6 border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Common Use Cases
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Portfolio Managers:</strong> Fetch risk metrics and predictions for your holdings</li>
            <li>• <strong>Trading Bots:</strong> Real-time protocol data, volatility predictions, alerts</li>
            <li>• <strong>Dashboards:</strong> Embed DeFi risk analysis in your platform</li>
            <li>• <strong>Research:</strong> Export governance data, sentiment analysis, historical metrics</li>
            <li>• <strong>Risk Monitoring:</strong> Integrate security incident alerts into your systems</li>
          </ul>
        </Card>

        {/* Pricing Info */}
        <Card className="p-6 border-border">
          <h3 className="font-semibold text-foreground mb-3">Pro Tier Includes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Daily Quota</p>
              <p className="font-semibold text-foreground">10,000 calls</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rate Limit</p>
              <p className="font-semibold text-foreground">100 req/sec</p>
            </div>
            <div>
              <p className="text-muted-foreground">Endpoints</p>
              <p className="font-semibold text-foreground">All public + Pro</p>
            </div>
            <div>
              <p className="text-muted-foreground">SLA</p>
              <p className="font-semibold text-foreground">99.5% uptime</p>
            </div>
            <div>
              <p className="text-muted-foreground">Response Time</p>
              <p className="font-semibold text-foreground">&lt;100ms avg</p>
            </div>
            <div>
              <p className="text-muted-foreground">Support</p>
              <p className="font-semibold text-foreground">Email support</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
