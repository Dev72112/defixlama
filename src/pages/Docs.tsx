import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Book, Code, Database, Users, HelpCircle, ExternalLink } from "lucide-react";

export default function Docs() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const exampleWebhook = `curl -X POST https://your-webhook.example.com/webhooks/protocols \\
  -H 'Content-Type: application/json' \\
  -H 'X-Signature: <hmac>' \\
  -d '{"event":"protocol_listed","protocol":{"name":"ExampleProtocol","chain":"X Layer","tvl":12345}}'`;

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleWebhook);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <Layout>
      <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t('docs.title')}</h1>
          <p className="text-muted-foreground">{t('docs.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/">
            <Button variant="ghost">{t('docs.backToHome')}</Button>
          </Link>
          <a href="https://github.com/Mystical-pixels/defixlama" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">{t('docs.viewOnGithub')}</Button>
          </a>
        </div>
      </div>

      {/* Table of contents */}
      <Card className="p-4 mb-4">
        <h3 className="text-sm font-medium mb-2">{t('docs.contents')}</h3>
        <div className="flex flex-wrap gap-2">
          <a href="#about" className="text-sm text-primary hover:underline">{t('docs.about')}</a>
          <a href="#quick-start" className="text-sm text-primary hover:underline">{t('docs.quickStart')}</a>
          <a href="#api-webhooks" className="text-sm text-primary hover:underline">{t('docs.apiWebhooks')}</a>
          <a href="#data-sources" className="text-sm text-primary hover:underline">{t('docs.dataSources')}</a>
          <a href="#contributing" className="text-sm text-primary hover:underline">{t('docs.contributing')}</a>
          <a href="#faq" className="text-sm text-primary hover:underline">{t('docs.faq')}</a>
        </div>
      </Card>

      <Card id="about" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.aboutThisSite')}</h2>
        <p className="text-muted-foreground mb-2">
          {t('docs.aboutDescription1')}
        </p>
        <p className="text-muted-foreground">
          {t('docs.aboutDescription2')}
        </p>
      </Card>

      <Card id="quick-start" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.quickStart')}</h2>
        <ol className="list-decimal pl-6 text-muted-foreground">
          <li>{t('docs.quickStartStep1')}</li>
          <li>{t('docs.quickStartStep2')}</li>
          <li>{t('docs.quickStartStep3')}</li>
        </ol>
      </Card>

      <Card id="api-webhooks" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.apiWebhooks')}</h2>
        <p className="text-muted-foreground mb-2">
          {t('docs.apiWebhooksDescription')}
        </p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>/webhooks/protocols - {t('docs.webhooksProtocols')}</li>
          <li>/webhooks/dexs - {t('docs.webhooksDexs')}</li>
          <li>/webhooks/fees - {t('docs.webhooksFees')}</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          {t('docs.webhooksTips')}
        </p>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">{t('docs.exampleWebhook')}</h4>
          <div className="relative">
            <pre className="rounded-md bg-muted/10 p-3 overflow-auto text-sm"><code>{exampleWebhook}</code></pre>
            <div className="absolute right-2 top-2">
              <Button size="sm" variant="ghost" onClick={copyExample}>{copied ? t('docs.copied') : t('docs.copy')}</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card id="data-sources" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.dataSourcesNotes')}</h2>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>{t('docs.dataSource1')}</li>
          <li>{t('docs.dataSource2')}</li>
          <li>{t('docs.dataSource3')}</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">{t('docs.dataSourcesNote')}</p>
      </Card>

      <Card id="contributing" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.contributing')}</h2>
        <p className="text-muted-foreground mb-2">
          {t('docs.contributingDescription1')}
        </p>
        <p className="text-muted-foreground">{t('docs.contributingDescription2')}</p>
      </Card>

      <Card id="faq" className="p-6 mb-4">
        <h2 className="text-lg font-medium mb-2">{t('docs.faqTroubleshooting')}</h2>
        <div className="text-muted-foreground">
          <h3 className="font-medium">{t('docs.faq1Question')}</h3>
          <p>{t('docs.faq1Answer')}</p>
          <h3 className="font-medium mt-3">{t('docs.faq2Question')}</h3>
          <p>{t('docs.faq2Answer')}</p>
        </div>
      </Card>
      </div>
    </Layout>
  );
}
