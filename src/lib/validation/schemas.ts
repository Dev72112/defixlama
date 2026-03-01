import { z } from "zod";

// DefiLlama protocol response
export const defillamaProtocolSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  symbol: z.string().optional().nullable(),
  tvl: z.number().optional().nullable(),
  change_1d: z.number().optional().nullable(),
  change_7d: z.number().optional().nullable(),
  category: z.string().optional().nullable(),
  chains: z.array(z.string()).optional(),
  logo: z.string().optional().nullable(),
  slug: z.string().optional(),
});

// CoinGecko price response
export const coingeckoPriceSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number().optional().nullable(),
  price_change_percentage_24h: z.number().optional().nullable(),
  market_cap: z.number().optional().nullable(),
  total_volume: z.number().optional().nullable(),
  image: z.string().optional().nullable(),
});

// Generic validators
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateDataStrict<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): T[] {
  return data
    .map((item) => {
      const result = schema.safeParse(item);
      return result.success ? result.data : null;
    })
    .filter((item): item is T => item !== null);
}
