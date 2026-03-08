import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Last updated:</strong> March 2026 · <strong>Effective date:</strong> March 2026
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using DefiXlama ("the Service"), operated by xLama OS, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2>2. Description of Service</h2>
          <p>DefiXlama is a DeFi analytics platform providing:</p>
          <ul>
            <li>Real-time blockchain data and analytics</li>
            <li>Protocol and token tracking</li>
            <li>Whale activity monitoring</li>
            <li>Yield intelligence</li>
            <li>PRO tier features for paid subscribers</li>
          </ul>

          <h2>3. Subscription Plans</h2>
          <p>DefiXlama offers the following plans:</p>
          <ul>
            <li><strong>Free</strong>: Limited features, no payment required</li>
            <li><strong>Pro</strong> ($29/month): Full analytics access, 7-day free trial</li>
            <li><strong>Pro Plus</strong> ($49/month): Advanced AI features, 7-day free trial</li>
            <li><strong>Enterprise</strong>: Custom pricing, contact us</li>
          </ul>
          <p>Subscriptions are billed monthly. Your free trial begins on signup and ends after 7 days. You will not be charged during the trial period.</p>

          <h2>4. Payment and Billing</h2>
          <ul>
            <li>Payments are processed securely by Paddle (paddle.com)</li>
            <li>Subscriptions auto-renew monthly unless cancelled</li>
            <li>You may cancel at any time through your account settings</li>
            <li>Access continues until the end of your current billing period</li>
            <li>No refunds for partial months (see <Link to="/refunds" className="text-primary hover:underline">Refund Policy</Link>)</li>
          </ul>

          <h2>5. Free Trial</h2>
          <ul>
            <li>7-day free trial available for Pro and Pro Plus plans</li>
            <li>Full tier access during trial</li>
            <li>Cancel before trial ends to avoid charges</li>
            <li>One trial per user per plan</li>
          </ul>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape or mass-extract data from the platform</li>
            <li>Resell or redistribute data without written permission</li>
            <li>Use the service for illegal activities</li>
            <li>Attempt to reverse engineer the platform</li>
            <li>Share account credentials with others</li>
          </ul>

          <h2>7. Data Accuracy</h2>
          <p>DefiXlama provides blockchain data for informational purposes only.</p>
          <ul>
            <li>Data is sourced from public blockchains and verified APIs</li>
            <li>We do not guarantee 100% accuracy of all data</li>
            <li>Nothing on DefiXlama constitutes financial advice</li>
            <li>Always do your own research (DYOR)</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <ul>
            <li>DefiXlama platform and content are owned by xLama OS</li>
            <li>You may not reproduce or redistribute platform content</li>
            <li>Your account data belongs to you</li>
          </ul>

          <h2>9. Privacy</h2>
          <p>Your use of DefiXlama is also governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>

          <h2>10. Termination</h2>
          <p>We reserve the right to terminate accounts that violate these terms. You may terminate your account at any time.</p>

          <h2>11. Limitation of Liability</h2>
          <p>DefiXlama is provided "as is" without warranties. xLama OS is not liable for any financial losses resulting from use of the platform.</p>

          <h2>12. Governing Law</h2>
          <p>These terms are governed by the laws of South Africa.</p>

          <h2>13. Changes to Terms</h2>
          <p>We may update these terms with notice. Continued use after changes constitutes acceptance.</p>

          <h2>14. Contact</h2>
          <p>Questions about these terms: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/refunds" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link to="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}