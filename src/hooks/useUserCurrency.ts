import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserCurrency {
  currency: 'ZAR' | 'USD';
  symbol: string;
  rate: number;
  country: string | null;
  loading: boolean;
  convertPrice: (usdAmount: number) => number;
  formatPrice: (usdAmount: number) => string;
}

export function useUserCurrency(): UserCurrency {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [country, setCountry] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        // Check profile first
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('country')
            .eq('id', user.id)
            .maybeSingle();

          if (data?.country && !cancelled) {
            setCountry(data.country);
            if (data.country === 'ZA') {
              setCurrency('ZAR');
            }
          }
        }

        // If no stored country, detect via geo-IP
        if (!country) {
          try {
            const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              const geo = await res.json();
              if (!cancelled && geo.country_code) {
                setCountry(geo.country_code);
                if (geo.country_code === 'ZA') {
                  setCurrency('ZAR');
                }
                // Save to profile
                if (user) {
                  await supabase
                    .from('profiles')
                    .update({ country: geo.country_code })
                    .eq('id', user.id);
                }
              }
            }
          } catch {
            // Geo detection failed, default to USD
          }
        }

        // Fetch USD→ZAR rate
        try {
          const rateRes = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
          if (rateRes.ok) {
            const rateData = await rateRes.json();
            if (!cancelled && rateData.rates?.ZAR) {
              setRate(rateData.rates.ZAR);
            }
          }
        } catch {
          // Rate fetch failed, use fallback
          if (!cancelled) setRate(18.5);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    detect();
    return () => { cancelled = true; };
  }, [user]);

  const convertPrice = useCallback((usdAmount: number) => {
    if (currency === 'ZAR') return Math.round(usdAmount * rate);
    return usdAmount;
  }, [currency, rate]);

  const formatPrice = useCallback((usdAmount: number) => {
    if (currency === 'ZAR') {
      return `R${Math.round(usdAmount * rate).toLocaleString()}`;
    }
    return `$${usdAmount}`;
  }, [currency, rate]);

  return {
    currency,
    symbol: currency === 'ZAR' ? 'R' : '$',
    rate,
    country,
    loading,
    convertPrice,
    formatPrice,
  };
}
