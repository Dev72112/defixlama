import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Last updated:</strong> March 2026 · <strong>Effective date:</strong> March 2026
          </p>

          <h2>1. Introduction</h2>
          <p>xLama OS ("we", "us", "our") operates DefiXlama. This policy explains how we collect, use, and protect your personal information.</p>
          <p>We are committed to constitutional data rights as defined in xLama OS Constitutional Doctrine v1.0, Article I.</p>

          <h2>2. Information We Collect</h2>
          <h3>Information you provide:</h3>
          <ul>
            <li>Email address (for account creation)</li>
            <li>Payment information (processed by NOWPayments, not stored by us)</li>
            <li>Wallet addresses (if connected, optional)</li>
            <li>Communication preferences</li>
          </ul>
          <h3>Information collected automatically:</h3>
          <ul>
            <li>Usage data (pages visited, features used)</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address (for security purposes)</li>
            <li>Analytics data (anonymized)</li>
          </ul>
          <h3>Blockchain data:</h3>
          <ul>
            <li>Public blockchain data is not personal information</li>
            <li>Wallet addresses you voluntarily connect are stored securely</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Provide and improve the DefiXlama service</li>
            <li>Process subscription payments via NOWPayments (crypto)</li>
            <li>Send service notifications and updates</li>
            <li>Respond to support requests</li>
            <li>Ensure platform security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Data Sharing</h2>
          <p><strong>We do not sell your personal data. Ever.</strong></p>
          <p>We share data only with:</p>
          <ul>
            <li><strong>Paddle</strong>: Payment processing (their privacy policy applies)</li>
            <li><strong>Infrastructure providers</strong>: Secure database hosting</li>
            <li><strong>Analytics providers</strong>: Anonymized usage data only</li>
          </ul>
          <p>We never share personal data with:</p>
          <ul>
            <li>Advertisers ❌</li>
            <li>Data brokers ❌</li>
            <li>Third party marketing ❌</li>
          </ul>

          <h2>5. Data Security</h2>
          <ul>
            <li>All data encrypted in transit (HTTPS)</li>
            <li>Database protected with Row Level Security</li>
            <li>Payment data never stored on our servers</li>
            <li>Regular security audits</li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p>To exercise these rights: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>

          <h2>7. Cookies</h2>
          <p>We use minimal cookies for:</p>
          <ul>
            <li>Authentication (required)</li>
            <li>User preferences (optional)</li>
            <li>Analytics (anonymized, optional)</li>
          </ul>
          <p>You can disable optional cookies in settings.</p>

          <h2>8. Data Retention</h2>
          <ul>
            <li>Active account data: retained while account active</li>
            <li>Cancelled account data: deleted after 90 days</li>
            <li>Payment records: retained 7 years (legal requirement)</li>
            <li>Analytics data: anonymized after 12 months</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>DefiXlama is not intended for users under 18. We do not knowingly collect data from minors.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We will notify users of significant changes via email. Continued use after changes constitutes acceptance.</p>

          <h2>11. Contact</h2>
          <p>Privacy questions: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>
          <p>Data requests: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/refunds" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link to="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}