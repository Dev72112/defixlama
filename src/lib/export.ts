// CSV Export utility

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(","));
  }

  const csv = csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Share utilities
export function shareToTwitter(text: string, url?: string) {
  const twitterUrl = new URL("https://twitter.com/intent/tweet");
  twitterUrl.searchParams.set("text", text);
  if (url) twitterUrl.searchParams.set("url", url);
  window.open(twitterUrl.toString(), "_blank", "width=550,height=420");
}

export function generateShareText(type: string, data: Record<string, any>): string {
  switch (type) {
    case "protocol":
      return `📊 ${data.name} on XLayer\n💰 TVL: $${(data.tvl / 1e6).toFixed(2)}M\n📈 24h: ${data.change_1d >= 0 ? "+" : ""}${data.change_1d?.toFixed(2)}%\n\nCheck it out on @defiXlama 👇`;
    case "token":
      return `💎 ${data.name} ($${data.symbol})\n💵 Price: $${data.price?.toFixed(data.price >= 1 ? 2 : 6)}\n📈 24h: ${data.change24h >= 0 ? "+" : ""}${data.change24h?.toFixed(2)}%\n\nLive on @defiXlama 👇`;
    case "donation":
      return `🎁 Supporting open-source DeFi analytics!\n\nJust donated to @defiXlama - the XLayer DeFi dashboard.\n\nContribute and help build better analytics tools 👇`;
    case "dashboard":
      return `📊 XLayer DeFi Stats\n💰 Total TVL: $${(data.tvl / 1e6).toFixed(2)}M\n🔥 ${data.protocols} protocols tracked\n📈 24h Volume: $${(data.volume / 1e6).toFixed(2)}M\n\nExplore at @defiXlama 👇`;
    default:
      return `Check out defiXlama - XLayer's premier DeFi analytics dashboard! 📊`;
  }
}
