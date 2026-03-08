import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Refunds() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Last updated:</strong> March 2026 · <strong>Effective date:</strong> March 2026
          </p>

          <h2>Our Commitment</h2>
          <p>We want you to be completely satisfied with DefiXlama PRO. That's why we offer a 7-day free trial — so you can experience the full platform before being charged.</p>

          <h2>Free Trial</h2>
          <ul>
            <li>All paid plans include a 7-day free trial</li>
            <li>You will NOT be charged during the trial period</li>
            <li>Cancel anytime during the trial with zero cost</li>
            <li>No questions asked cancellation during trial</li>
          </ul>

          <h2>Refund Eligibility</h2>
          <h3>You ARE eligible for a refund if:</h3>
          <ul>
            <li>You were charged due to a technical error on our end ✅</li>
            <li>Your account was compromised and used fraudulently ✅</li>
            <li>You were charged after cancelling your subscription ✅</li>
            <li>Service was unavailable for more than 72 consecutive hours ✅</li>
          </ul>
          <h3>You are NOT eligible for a refund if:</h3>
          <ul>
            <li>You forgot to cancel before the trial ended ❌</li>
            <li>You changed your mind after being charged ❌</li>
            <li>You didn't use the service during the billing period ❌</li>
            <li>Partial month usage ❌</li>
          </ul>

          <h2>How to Request a Refund</h2>
          <ol>
            <li>Email <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a> within 7 days of charge</li>
            <li>Include your account email and reason</li>
            <li>We respond within 2 business days</li>
            <li>Approved refunds processed within 5-10 business days</li>
          </ol>

          <h2>Subscription Cancellation</h2>
          <ul>
            <li>Cancel anytime in Account Settings → Manage Subscription</li>
            <li>Access continues until end of current billing period</li>
            <li>No penalty for cancellation</li>
            <li>You can resubscribe at any time</li>
          </ul>

          <h2>Plan Changes</h2>
          <ul>
            <li>Upgrading: charged prorated difference immediately</li>
            <li>Downgrading: takes effect next billing cycle</li>
            <li>No refund for downgrading mid-cycle</li>
          </ul>

          <h2>Disputes</h2>
          <p>If you believe you were charged incorrectly, contact us first at <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a> before initiating a chargeback. We resolve billing issues quickly and fairly.</p>

          <h2>Contact</h2>
          <p>Refund requests: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>
          <p>Billing questions: <a href="mailto:support.xlama@defixlama.com">support.xlama@defixlama.com</a></p>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}