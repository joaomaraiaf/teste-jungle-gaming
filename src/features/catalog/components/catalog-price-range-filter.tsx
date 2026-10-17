import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';

interface CatalogPriceRangeFilterProps {
  minPriceEth?: string;
  maxPriceEth?: string;
  onApply: (range: { minPriceEth?: string; maxPriceEth?: string }) => void;
}

const MIN_PRICE_CENTS = 2;
const MAX_PRICE_CENTS = 1230;
const PRICE_RANGE = MAX_PRICE_CENTS - MIN_PRICE_CENTS;
const formatPrice = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    cents / 100
  );
const formatEth = (cents: number) => (cents / 100).toFixed(2);
const parsePrice = (price: string | undefined, fallback: number) =>
  price === undefined
    ? fallback
    : Math.min(MAX_PRICE_CENTS, Math.max(MIN_PRICE_CENTS, Math.round(Number(price) * 100)));

const rangeInputClassName =
  'pointer-events-none absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2 appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E89B55] [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-0.5rem] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#241612] [&::-webkit-slider-thumb]:bg-[#D28A4C] [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#241612] [&::-moz-range-thumb]:bg-[#D28A4C]';

export function CatalogPriceRangeFilter({
  minPriceEth,
  maxPriceEth,
  onApply,
}: CatalogPriceRangeFilterProps) {
  const [minValue, setMinValue] = useState(() => parsePrice(minPriceEth, MIN_PRICE_CENTS));
  const [maxValue, setMaxValue] = useState(() => parsePrice(maxPriceEth, MAX_PRICE_CENTS));
  const left = ((minValue - MIN_PRICE_CENTS) / PRICE_RANGE) * 100;
  const width = ((maxValue - minValue) / PRICE_RANGE) * 100;

  useEffect(() => {
    setMinValue(parsePrice(minPriceEth, MIN_PRICE_CENTS));
    setMaxValue(parsePrice(maxPriceEth, MAX_PRICE_CENTS));
  }, [minPriceEth, maxPriceEth]);

  const applyRange = () =>
    onApply({
      minPriceEth: minValue === MIN_PRICE_CENTS ? undefined : formatEth(minValue),
      maxPriceEth: maxValue === MAX_PRICE_CENTS ? undefined : formatEth(maxValue),
    });

  return (
    <div className='flex flex-col gap-3 pl-3'>
      <div className='relative h-6 touch-none' role='group' aria-label='Faixa de preço em ETH'>
        <span className='absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#3F2319]' />
        <span
          className='absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#D28A4C]'
          style={{ left: `${left}%`, width: `${width}%` }}
          aria-hidden='true'
        />
        <input
          type='range'
          min={MIN_PRICE_CENTS}
          max={MAX_PRICE_CENTS}
          step={1}
          value={minValue}
          aria-label='Preço mínimo em ETH'
          aria-valuetext={`${formatPrice(minValue)} ETH`}
          onChange={(event) => setMinValue(Math.min(Number(event.target.value), maxValue))}
          className={`${rangeInputClassName} z-10`}
        />
        <input
          type='range'
          min={MIN_PRICE_CENTS}
          max={MAX_PRICE_CENTS}
          step={1}
          value={maxValue}
          aria-label='Preço máximo em ETH'
          aria-valuetext={`${formatPrice(maxValue)} ETH`}
          onChange={(event) => setMaxValue(Math.max(Number(event.target.value), minValue))}
          className={`${rangeInputClassName} z-20`}
        />
      </div>
      <div className='flex items-center gap-2 text-xs text-[#CFB28C]'>
        <span>Preço:</span>
        <output aria-live='polite'>{`${formatPrice(minValue)} - ${formatPrice(maxValue)} ETH`}</output>
        <Button
          type='button'
          onClick={applyRange}
          className='ml-auto h-8 rounded-sm bg-[#D28A4C] px-3 text-xs font-bold text-[#140D0A] hover:bg-[#E89B55]'
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
