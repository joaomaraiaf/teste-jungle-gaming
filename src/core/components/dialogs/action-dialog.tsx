import type { DialogProps } from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';

interface ActionDialogProps extends DialogProps {
  title: ReactNode;
  children: ReactNode;
  alert?: {
    title?: string;
    description: ReactNode;
  };
  className?: string;
  button: React.ReactNode;
}

export function ActionDialog({
  title,
  children,
  alert,
  className,
  button,
  ...props
}: ActionDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent
        className={`sm:max-w-2xl lg:max-w-2xl gap-8 p-4 lg:p-8 ${className}`}
        aria-description='Janela de diálogo para confirmação de ação.'
      >
        <DialogHeader className='space-y-0'>
          <DialogTitle className='text-xl lg:text-2xl font-bold text-red-700 line-clamp-2 text-center'>
            {title}
          </DialogTitle>
        </DialogHeader>
        {alert && (
          <Alert className='px-6 py-4 font-inter bg-red-100 border-y-0 border-r-0 border-l-4 border-red-500 rounded-sm'>
            {alert.title && (
              <AlertTitle className='lg:text-base font-bold'>{alert.title}</AlertTitle>
            )}
            <AlertDescription className='lg:text-base font-sans text-neutral-950'>
              {alert.description}
            </AlertDescription>
          </Alert>
        )}

        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
