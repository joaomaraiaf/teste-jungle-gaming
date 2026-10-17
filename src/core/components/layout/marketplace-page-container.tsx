import type { ReactNode } from 'react';
import { cn } from '@/core/lib/utils';

export const MARKETPLACE_FULL_WIDTH_CLASS = 'lg:-mx-[7.5rem] lg:w-[calc(100%+15rem)]';

interface MarketplacePageContainerProps {
  children: ReactNode;
  className?: string;
}

export function MarketplacePageContainer({ children, className }: MarketplacePageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[90rem] flex-col px-5 pb-24 pt-6 sm:px-8 md:pb-6 lg:px-[7.5rem]',
        className
      )}
    >
      {children}
    </div>
  );
}
