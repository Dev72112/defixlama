import { useUserCurrency } from '@/hooks/useUserCurrency';

interface CurrencyPriceProps {
  usdAmount: number;
  className?: string;
  showSecondary?: boolean;
}

export function CurrencyPrice({ usdAmount, className, showSecondary = true }: CurrencyPriceProps) {
  const { currency, formatPrice } = useUserCurrency();

  const primary = formatPrice(usdAmount);

  return (
    <span className={className}>
      {primary}
      {showSecondary && currency !== 'USD' && (
        <span className="text-muted-foreground text-xs ml-1">
          (${usdAmount} USD)
        </span>
      )}
    </span>
  );
}
