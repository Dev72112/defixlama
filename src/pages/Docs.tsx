import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Docs() {
  const [copied, setCopied] = useState(false);
  const exampleWebhook = `curl -X POST https://your-webhook.example.com/webhooks/protocols \
  -H 'Content-Type: application/json' \
  -H 'X-Signature: <hmac>' \
  -d '{\n+    "event":"protocol_listed",\n+    "protocol":{ "name":"ExampleProtocol","chain":"X Layer","tvl":12345, "slug":"exampleprotocol" },\n+    "timestamp": 1620000000\n+  }'`;

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleWebhook);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Documentation</h1>
          <p className="text-muted-foreground">Guides, integration notes and contribution info</p>
        </div>
        <div className="flex gap-2">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <a href="https://github.com/Mystical-pixels/defixlama" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">View on GitHub</Button>
          </a>
        </div>
      </div>

      {/* Table of contents */}
      <Card className="p-4 mb-4">
        <h3 className="text-sm font-medium mb-2">Contents</h3>
        <div className="flex flex-wrap gap-2">
          <a href="#about" className="text-sm text-primary hover:underline">About</a>
          <a href="#quick-start" className="text-sm text-primary hover:underline">Quick Start</a>
          <a href="#api-webhooks" className="text-sm text-primary hover:underline">API & Webhooks</a>
          <a href="#data-sources" className="text-sm text-primary hover:underline">Data Sources</a>
          <a href="#contributing" className="text-sm text-primary hover:underline">Contributing</a>
          <a href="#faq" className="text-sm text-primary hover:underline">FAQ</a>
        </div>
      </Card>

      <Card id="about" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">About This Site</h2>
        <p className="text-muted-foreground mb-2">
          This site aggregates analytics from DefiLlama and additional on-chain/off-chain sources
          to surface protocol metrics, DEX volumes, TVL, fees, and security information for the
          XLayer ecosystem. Data is refreshed periodically and enriched where possible.
        </p>
        <p className="text-muted-foreground">
          The frontend is a read-only analytics surface; integrations should rely on the
          underlying data providers or reach out for managed endpoints.
        </p>
      </Card>

      <Card id="quick-start" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">Quick Start</h2>
        <ol className="list-decimal pl-6 text-muted-foreground">
          <li>Browse the dashboard for top-level metrics and trend charts.</li>
          <li>Open protocol, DEX or chain detail pages for historical TVL and volume.</li>
          <li>Use the Activities page to inspect chronological updates and changes.</li>
        </ol>
      </Card>

      <Card id="api-webhooks" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">API & Webhooks</h2>
        <p className="text-muted-foreground mb-2">
          We don't provide a public REST API from the frontend. Example webhook/event endpoints
          (self-hosted or managed) that consumers may implement:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>/webhooks/protocols - Protocol updates (new listings, TVL updates)</li>
          <li>/webhooks/dexs - DEX volume updates and spikes</li>
          <li>/webhooks/fees - Protocol fee activity</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Tips: include a signed HMAC header and retry/backoff logic for reliable delivery.
        </p>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Example webhook (curl)</h4>
          <div className="relative">
            <pre className="rounded-md bg-muted/10 p-3 overflow-auto text-sm"><code>{exampleWebhook}</code></pre>
            <div className="absolute right-2 top-2">
              <Button size="sm" variant="ghost" onClick={copyExample}>{copied ? 'Copied' : 'Copy'}</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card id="data-sources" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">Data Sources & Notes</h2>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>DefiLlama — TVL, protocol metadata, chain aggregates</li>
          <li>Yields APIs — pooled APY and pool metadata</li>
          <li>On-chain indexers — where available for enrichment (balances, token prices)</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">Data fields may vary between providers; we normalize common fields but fallbacks exist for missing values.</p>
      </Card>

      <Card id="contributing" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">Contributing</h2>
        <p className="text-muted-foreground mb-2">
          Contributions, bug reports, and data-improvement suggestions are welcome. Open an issue or PR on GitHub with a summary and reproducible steps.
        </p>
        <p className="text-muted-foreground">Please include the data source and an example payload if reporting normalization issues.</p>
      </Card>

      <Card id="faq" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">FAQ & Troubleshooting</h2>
        <div className="text-muted-foreground">
          <h3 className="font-medium">Why is TVL different from other sites?</h3>
          <p>TVL depends on included assets, price sources, and on-chain/external balances. We normalize to USD but differences can occur.</p>
          <h3 className="font-medium mt-3">Missing protocol data?</h3>
          <p>Open an issue with the protocol name and chain; we will verify and add enrichment where possible.</p>
        </div>
      </Card>
    </div>
  );
}
