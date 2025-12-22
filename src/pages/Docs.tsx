import { Card } from "@/components/ui/card";

export default function Docs() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Documentation</h1>

      <Card className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">About This Site</h2>
        <p className="text-muted-foreground mb-2">
          This site provides analytics aggregated from DefiLlama and several on-chain and off-chain
          sources to surface protocol metrics, DEX volumes, TVL, and security information for the
          XLayer ecosystem. Data is refreshed periodically and enriched with additional sources
          where available.
        </p>
        <p className="text-muted-foreground">
          We do not provide a public API from this frontend. Instead, we publish integration points
          and webhook endpoints (see below) so community members can receive updates about data
          changes.
        </p>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">API & Webhooks</h2>
        <p className="text-muted-foreground mb-2">
          While we don't expose an open REST API from this site, you can integrate with our
          webhook system to receive events about updates. Example webhook URLs:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>/webhooks/protocols - Protocol updates (TVL changes, new audits)</li>
          <li>/webhooks/dexs - DEX volume updates</li>
          <li>/webhooks/tokens - Price & market updates for tracked tokens</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Note: These are example webhook paths; hosting and authentication for webhooks is the
          responsibility of integrators. If you'd like official endpoints, please contact the
          maintainers for access.
        </p>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">Contributing</h2>
        <p className="text-muted-foreground">
          Contributions, bug reports, and data-improvement suggestions are welcome. Please open an
          issue on the repo or reach out via the project channels.
        </p>
      </Card>
    </div>
  );
}
