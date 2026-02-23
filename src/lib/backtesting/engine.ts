// Simple backtesting engine for yield farming strategies
// Simulates historical returns based on protocol TVL and APY data

export interface BacktestProtocol {
  slug: string;
  weight: number; // percentage allocation
}

export interface BacktestConfig {
  protocols: BacktestProtocol[];
  startDate: Date;
  endDate: Date;
  initialCapital: number;
}

export interface DailyResult {
  date: string;
  navPerShare: number;
  totalValue: number;
  returnsPercent: number;
  dayChangePercent: number;
}

export interface BacktestResults {
  config: BacktestConfig;
  initialValue: number;
  finalValue: number;
  returnsPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winDays: number;
  totalDays: number;
  averageDailyReturn: number;
  daily: DailyResult[];
}

// Mock historical APY data generator
// In production, fetch from real historical data
function generateMockAPYHistory(
  protocolSlug: string,
  startDate: Date,
  endDate: Date
): Map<string, number> {
  const history = new Map<string, number>();
  const baseAPY: Record<string, number> = {
    aave: 3.5,
    curve: 5.2,
    lido: 2.8,
    yearn: 8.1,
    balancer: 6.5,
    'compound': 2.1,
  };

  const baseApy = baseAPY[protocolSlug.toLowerCase()] || 4.0;

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    // Add some volatility to APY: ±30% variation
    const variation = (Math.random() - 0.5) * 0.6;
    const apy = Math.max(0.5, baseApy * (1 + variation));
    history.set(dateStr, apy);

    current = new Date(current.getTime() + 86400000); // +1 day
  }

  return history;
}

export function runBacktest(config: BacktestConfig): BacktestResults {
  const dailyResults: DailyResult[] = [];
  let currentValue = config.initialCapital;
  let previousValue = config.initialCapital;
  let minValue = config.initialCapital;
  let winDays = 0;

  // Normalize weights
  const totalWeight = config.protocols.reduce((sum, p) => sum + p.weight, 0);
  const normalizedProtocols = config.protocols.map((p) => ({
    ...p,
    weight: p.weight / totalWeight,
  }));

  // Get APY histories for all protocols
  const apyHistories = new Map<string, Map<string, number>>();
  for (const protocol of normalizedProtocols) {
    apyHistories.set(protocol.slug, generateMockAPYHistory(protocol.slug, config.startDate, config.endDate));
  }

  // Simulate day by day
  let current = new Date(config.startDate);
  while (current <= config.endDate) {
    const dateStr = current.toISOString().split('T')[0];
    let dayReturn = 0;

    // Calculate weighted daily return
    for (const protocol of normalizedProtocols) {
      const apyHistory = apyHistories.get(protocol.slug);
      if (!apyHistory) continue;

      const apy = apyHistory.get(dateStr) ?? 4.0;
      const dailyReturn = apy / 365 / 100; // APY to daily rate
      dayReturn += dailyReturn * protocol.weight;
    }

    // Update value
    previousValue = currentValue;
    currentValue = currentValue * (1 + dayReturn);

    // Track min for drawdown
    minValue = Math.min(minValue, currentValue);

    // Calculate returns
    const returnsPercent = ((currentValue - config.initialCapital) / config.initialCapital) * 100;
    const dayChangePercent = ((currentValue - previousValue) / previousValue) * 100;

    if (dayChangePercent > 0) winDays++;

    dailyResults.push({
      date: dateStr,
      navPerShare: currentValue / config.initialCapital,
      totalValue: currentValue,
      returnsPercent,
      dayChangePercent,
    });

    current = new Date(current.getTime() + 86400000);
  }

  // Calculate metrics
  const totalDays = dailyResults.length;
  const totalReturnsPercent = ((currentValue - config.initialCapital) / config.initialCapital) * 100;
  const maxDrawdown = ((minValue - config.initialCapital) / config.initialCapital) * 100;

  // Calculate Sharpe ratio (simplified: use daily returns of portfolio)
  const dailyReturns = dailyResults.map((r) => r.dayChangePercent);
  const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = (avgDailyReturn * 252) / (stdDev * Math.sqrt(252)); // Annualized

  return {
    config,
    initialValue: config.initialCapital,
    finalValue: currentValue,
    returnsPercent: totalReturnsPercent,
    sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
    maxDrawdown,
    winDays,
    totalDays,
    averageDailyReturn: avgDailyReturn,
    daily: dailyResults,
  };
}
